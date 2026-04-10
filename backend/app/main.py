import os
import json
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from . import models
from .database import get_db
from .rate_limit import clear_rate_limit_bucket, enforce_failed_attempt_limit, enforce_rate_limit, register_failed_attempt
from .schemas import (
    AdminAuditLogResponse,
    AdminRoleUpdateRequest,
    AdminUserResponse,
    AdminVisibilityUpdateRequest,
    AuthLoginRequest,
    AuthPendingResponse,
    AuthRegisterRequest,
    AuthResponse,
    ChangePasswordRequest,
    ChatMessageCreate,
    ChatMessageResponse,
    ConversationArchiveRequest,
    ConversationDetailResponse,
    ConversationSummaryResponse,
    EmbeddingUpdate,
    EmailVerificationRequest,
    ResendVerificationRequest,
    ReviewCreate,
    ReviewResponse,
    SearchQuery,
    TagsUpdate,
    UserCreate,
    UserResponse,
    UserUpdate,
)
from .search import smart_search, update_search_vector
from .security import (
    ensure_secret_key,
    get_current_user,
    get_optional_current_user,
    generate_one_time_token,
    hash_one_time_token,
    hash_password,
    issue_access_token,
    require_admin,
    require_password_change_completed,
    verify_password,
)
from .services.email_service import (
    send_password_change_confirmation_email,
    send_registration_verification_email,
)
from .services.onboarding_agent import extract_profile_data, get_interviewer_response
from .test_users import seed_test_users

DEBUG = os.getenv("DEBUG", "false").lower() == "true"
SWAGGER_USERNAME = os.getenv("SWAGGER_USERNAME")
SWAGGER_PASSWORD = os.getenv("SWAGGER_PASSWORD")
SWAGGER_ENABLED = bool(SWAGGER_USERNAME and SWAGGER_PASSWORD)
TERMS_VERSION = os.getenv("TERMS_VERSION", "2026-04-09")
PRIVACY_POLICY_VERSION = os.getenv("PRIVACY_POLICY_VERSION", "2026-04-09")
BOOTSTRAP_ADMIN_EMAIL = os.getenv("BOOTSTRAP_ADMIN_EMAIL")
BOOTSTRAP_ADMIN_PASSWORD = os.getenv("BOOTSTRAP_ADMIN_PASSWORD")
REGISTER_VERIFICATION_TTL_SECONDS = int(os.getenv("REGISTER_VERIFICATION_TTL_SECONDS", str(60 * 60 * 24)))
PASSWORD_CHANGE_CONFIRM_TTL_SECONDS = int(os.getenv("PASSWORD_CHANGE_CONFIRM_TTL_SECONDS", str(60 * 15)))
logger = logging.getLogger(__name__)


def bootstrap_security_configuration() -> None:
    ensure_secret_key()
    if not BOOTSTRAP_ADMIN_EMAIL or not BOOTSTRAP_ADMIN_PASSWORD:
        raise RuntimeError("BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD must be set")

bootstrap_security_configuration()

swagger_security = HTTPBasic()
app = FastAPI(
    title="LoLSochnikKeK API",
    version="3.0.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api/v1")


class OnboardingStartResponse(BaseModel):
    session_id: str


class OnboardingChatRequest(BaseModel):
    session_id: str
    text: str


class OnboardingChatResponse(BaseModel):
    reply: str
    is_ready_to_confirm: bool
    extracted_data: Optional[dict] = None


class OnboardingConfirmRequest(BaseModel):
    session_id: str


onboarding_sessions: Dict[str, Dict[str, object]] = {}


def get_session(session_id: str) -> Dict[str, object]:
    session = onboarding_sessions.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Onboarding session not found")
    return session


def should_persist_onboarding_answer(previous_slot: str, updated_state: Dict[str, object]) -> bool:
    next_slot = updated_state.get("current_slot")
    skipped_slots = set(updated_state.get("skipped_slots", []))

    if previous_slot in skipped_slots:
        return False
    if previous_slot == "done":
        return False
    return next_slot != previous_slot


def build_auth_response(user: models.User) -> AuthResponse:
    return AuthResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_profile_complete=bool(user.is_profile_complete),
        is_admin=bool(user.is_admin),
        must_change_password=bool(user.must_change_password),
        is_email_verified=bool(user.is_email_verified),
        access_token=issue_access_token(user),
    )


def create_email_action_token(
    db: Session,
    *,
    action: str,
    email: str,
    user_id: Optional[UUID] = None,
    payload: Optional[dict] = None,
    ttl_seconds: int,
) -> str:
    now = datetime.now(timezone.utc)
    token = generate_one_time_token()
    token_hash = hash_one_time_token(token)
    db.query(models.EmailActionToken).filter(
        models.EmailActionToken.email == email,
        models.EmailActionToken.action == action,
        models.EmailActionToken.used_at.is_(None),
    ).update({"used_at": now}, synchronize_session=False)
    db.add(
        models.EmailActionToken(
            user_id=user_id,
            email=email,
            action=action,
            token_hash=token_hash,
            payload_json=json.dumps(payload) if payload else None,
            expires_at=now + timedelta(seconds=ttl_seconds),
        )
    )
    db.flush()
    return token


def get_active_email_action_token(db: Session, action: str, token: str) -> models.EmailActionToken:
    token_hash = hash_one_time_token(token)
    token_row = db.query(models.EmailActionToken).filter(
        models.EmailActionToken.token_hash == token_hash,
        models.EmailActionToken.action == action,
    ).first()
    if not token_row:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    if token_row.used_at is not None:
        raise HTTPException(status_code=400, detail="Token has already been used")
    if token_row.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token has expired")
    return token_row


def send_registration_verification(db: Session, user: models.User) -> None:
    try:
        token = create_email_action_token(
            db,
            action="register_verify",
            email=user.email,
            user_id=user.id,
            ttl_seconds=REGISTER_VERIFICATION_TTL_SECONDS,
        )
        send_registration_verification_email(user.email, token)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


def send_password_change_confirmation(db: Session, user: models.User, new_password_hash: str) -> None:
    try:
        token = create_email_action_token(
            db,
            action="password_change_confirm",
            email=user.email,
            user_id=user.id,
            payload={"new_password_hash": new_password_hash},
            ttl_seconds=PASSWORD_CHANGE_CONFIRM_TTL_SECONDS,
        )
        send_password_change_confirmation_email(user.email, token)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


def write_admin_audit_log(
    db: Session,
    admin_id: UUID,
    action: str,
    target_user_id: Optional[UUID] = None,
    details: Optional[str] = None,
) -> None:
    db.add(
        models.AdminAuditLog(
            admin_id=admin_id,
            target_user_id=target_user_id,
            action=action,
            details=details,
        )
    )


def build_admin_audit_response(
    log: models.AdminAuditLog,
    admin_users: Dict[UUID, models.User],
    target_users: Dict[UUID, models.User],
) -> AdminAuditLogResponse:
    admin_user = admin_users.get(log.admin_id)
    target_user = target_users.get(log.target_user_id) if log.target_user_id else None
    return AdminAuditLogResponse(
        id=log.id,
        admin_id=log.admin_id,
        admin_name=admin_user.full_name if admin_user else "Администратор",
        admin_email=admin_user.email if admin_user else None,
        target_user_id=log.target_user_id,
        target_user_name=target_user.full_name if target_user else None,
        target_user_email=target_user.email if target_user else None,
        action=log.action,
        details=log.details,
        created_at=log.created_at,
    )


def ensure_default_admin() -> None:
    db = next(get_db())
    try:
        admin_user = db.query(models.User).filter(func.lower(models.User.email) == BOOTSTRAP_ADMIN_EMAIL.lower()).first()
        if admin_user:
            changed = False
            if not admin_user.is_admin:
                admin_user.is_admin = True
                changed = True
            if not admin_user.password_hash:
                admin_user.password_hash = hash_password(BOOTSTRAP_ADMIN_PASSWORD)
                changed = True
            if admin_user.must_change_password:
                admin_user.must_change_password = False
                changed = True
            if not admin_user.is_email_verified:
                admin_user.is_email_verified = True
                admin_user.email_verified_at = admin_user.email_verified_at or datetime.now(timezone.utc)
                changed = True
            if changed:
                db.commit()
            return

        admin_user = models.User(
            email=BOOTSTRAP_ADMIN_EMAIL.lower(),
            password_hash=hash_password(BOOTSTRAP_ADMIN_PASSWORD),
            full_name="Администратор",
            course=1,
            is_mentor=False,
            is_admin=True,
            must_change_password=False,
            is_email_verified=True,
            email_verified_at=datetime.now(timezone.utc),
            is_profile_complete=False,
            tags_array=[],
        )
        db.add(admin_user)
        db.commit()
    finally:
        db.close()


def verify_swagger_credentials(request: Request, credentials: HTTPBasicCredentials = Depends(swagger_security)) -> str:
    if not SWAGGER_ENABLED:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    enforce_rate_limit(request, "swagger")

    correct_username = secrets.compare_digest(credentials.username, SWAGGER_USERNAME)
    correct_password = secrets.compare_digest(credentials.password, SWAGGER_PASSWORD)
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username


def require_same_user_or_admin(user_id: UUID, current_user: models.User) -> None:
    if current_user.is_admin or current_user.id == user_id:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")


def delete_user_related_data(db: Session, user_id: UUID) -> None:
    conversation_ids = [
        row[0]
        for row in db.query(models.Conversation.id).filter(
            or_(
                models.Conversation.direct_user_a_id == user_id,
                models.Conversation.direct_user_b_id == user_id,
                models.Conversation.support_user_id == user_id,
            )
        ).all()
    ]
    if conversation_ids:
        db.query(models.ChatMessage).filter(models.ChatMessage.conversation_id.in_(conversation_ids)).delete(
            synchronize_session=False
        )
        db.query(models.Conversation).filter(models.Conversation.id.in_(conversation_ids)).delete(
            synchronize_session=False
        )
    db.query(models.Review).filter(
        or_(models.Review.reviewer_id == user_id, models.Review.reviewed_id == user_id)
    ).delete(synchronize_session=False)
    db.query(models.AdminAuditLog).filter(
        or_(models.AdminAuditLog.admin_id == user_id, models.AdminAuditLog.target_user_id == user_id)
    ).delete(synchronize_session=False)


ensure_default_admin()


def ensure_support_conversation(db: Session, user_id: UUID) -> models.Conversation:
    conversation = (
        db.query(models.Conversation)
        .filter(models.Conversation.kind == "support", models.Conversation.support_user_id == user_id)
        .first()
    )
    if conversation:
        return conversation

    conversation = models.Conversation(kind="support", support_user_id=user_id)
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


def ensure_support_conversations_for_existing_users() -> None:
    db = next(get_db())
    try:
        user_ids = [
            user_id
            for (user_id,) in db.query(models.User.id)
            .filter(models.User.is_admin == False)
            .all()
        ]
        for user_id in user_ids:
            ensure_support_conversation(db, user_id)
    finally:
        db.close()


ensure_support_conversations_for_existing_users()


def get_direct_counterpart_id(conversation: models.Conversation, current_user_id: UUID) -> Optional[UUID]:
    if conversation.direct_user_a_id == current_user_id:
        return conversation.direct_user_b_id
    if conversation.direct_user_b_id == current_user_id:
        return conversation.direct_user_a_id
    return None


def user_can_access_conversation(current_user: models.User, conversation: models.Conversation) -> bool:
    if conversation.kind == "support":
        return current_user.is_admin or conversation.support_user_id == current_user.id
    return current_user.id in {conversation.direct_user_a_id, conversation.direct_user_b_id}


def get_archive_state(current_user: models.User, conversation: models.Conversation) -> bool:
    if conversation.kind == "support":
        return conversation.archived_for_admin if current_user.is_admin else False
    if conversation.direct_user_a_id == current_user.id:
        return bool(conversation.archived_for_user_a)
    if conversation.direct_user_b_id == current_user.id:
        return bool(conversation.archived_for_user_b)
    return False


def set_archive_state(current_user: models.User, conversation: models.Conversation, archived: bool) -> None:
    if conversation.kind == "support":
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Only admins can archive support chats")
        conversation.archived_for_admin = archived
        return

    if conversation.direct_user_a_id == current_user.id:
        conversation.archived_for_user_a = archived
        return
    if conversation.direct_user_b_id == current_user.id:
        conversation.archived_for_user_b = archived
        return
    raise HTTPException(status_code=403, detail="Conversation access denied")


def get_conversation_title(current_user: models.User, conversation: models.Conversation, db: Session) -> str:
    if conversation.kind == "support":
        if current_user.is_admin:
            support_user = db.query(models.User).filter(models.User.id == conversation.support_user_id).first()
            support_name = support_user.full_name if support_user else "Пользователь"
            return f"Техподдержка · {support_name}"
        return "Техподдержка"

    counterpart_id = get_direct_counterpart_id(conversation, current_user.id)
    counterpart = db.query(models.User).filter(models.User.id == counterpart_id).first() if counterpart_id else None
    return counterpart.full_name if counterpart else "Чат"


def get_conversation_counterpart_id(current_user: models.User, conversation: models.Conversation) -> Optional[UUID]:
    if conversation.kind == "support":
        return conversation.support_user_id if current_user.is_admin else None
    return get_direct_counterpart_id(conversation, current_user.id)


def count_unread_messages(db: Session, current_user: models.User, conversation: models.Conversation) -> int:
    query = db.query(models.ChatMessage).filter(
        models.ChatMessage.conversation_id == conversation.id,
        models.ChatMessage.sender_id != current_user.id,
        models.ChatMessage.read_at.is_(None),
    )
    if conversation.kind == "support" and current_user.is_admin:
        query = query.filter(models.ChatMessage.sender_id == conversation.support_user_id)
    return query.count()


def mark_conversation_read(db: Session, current_user: models.User, conversation: models.Conversation) -> None:
    unread_query = db.query(models.ChatMessage).filter(
        models.ChatMessage.conversation_id == conversation.id,
        models.ChatMessage.sender_id != current_user.id,
        models.ChatMessage.read_at.is_(None),
    )
    if conversation.kind == "support" and current_user.is_admin:
        unread_query = unread_query.filter(models.ChatMessage.sender_id == conversation.support_user_id)
    unread_messages = unread_query.all()
    if not unread_messages:
        return
    now = datetime.now(timezone.utc)
    for message in unread_messages:
        message.read_at = now
    db.commit()


def build_conversation_summary(db: Session, current_user: models.User, conversation: models.Conversation) -> ConversationSummaryResponse:
    last_message = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.conversation_id == conversation.id)
        .order_by(models.ChatMessage.created_at.desc(), models.ChatMessage.id.desc())
        .first()
    )
    return ConversationSummaryResponse(
        id=conversation.id,
        kind=conversation.kind,
        title=get_conversation_title(current_user, conversation, db),
        counterpart_id=get_conversation_counterpart_id(current_user, conversation),
        last_message_text=last_message.body if last_message else None,
        last_message_at=last_message.created_at if last_message else conversation.created_at,
        unread_count=count_unread_messages(db, current_user, conversation),
        archived=get_archive_state(current_user, conversation),
    )


@api_router.post("/auth/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register_account(payload: AuthRegisterRequest, request: Request, db: Session = Depends(get_db)):
    enforce_failed_attempt_limit(request, "auth-register-fail")

    if not payload.accepted_terms or not payload.accepted_privacy_policy:
        register_failed_attempt(request, "auth-register-fail")
        raise HTTPException(status_code=400, detail="You must accept the terms and privacy policy")

    existing_user = db.query(models.User).filter(func.lower(models.User.email) == payload.email.lower()).first()
    if existing_user:
        register_failed_attempt(request, "auth-register-fail")
        raise HTTPException(status_code=400, detail="Account with this email already exists")

    now = datetime.now(timezone.utc)
    user = models.User(
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        is_email_verified=False,
        full_name="Новый пользователь",
        course=1,
        is_mentor=False,
        is_profile_complete=False,
        tags_array=[],
        accepted_terms_at=now,
        accepted_terms_version=TERMS_VERSION,
        accepted_privacy_policy_at=now,
        accepted_privacy_policy_version=PRIVACY_POLICY_VERSION,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    ensure_support_conversation(db, user.id)
    try:
        send_registration_verification(db, user)
        db.commit()
    except HTTPException as exc:
        logger.warning("Registration verification email was not sent for %s: %s", user.email, exc.detail)
        db.rollback()
    clear_rate_limit_bucket(request, "auth-register-fail")
    return build_auth_response(user)


@api_router.post("/auth/login", response_model=AuthResponse)
def login_account(payload: AuthLoginRequest, request: Request, db: Session = Depends(get_db)):
    enforce_failed_attempt_limit(request, "auth-login-fail")

    user = db.query(models.User).filter(func.lower(models.User.email) == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        register_failed_attempt(request, "auth-login-fail")
        raise HTTPException(status_code=401, detail="Invalid email or password")
    clear_rate_limit_bucket(request, "auth-login-fail")
    return build_auth_response(user)


@api_router.get("/auth/me", response_model=AuthResponse)
def get_me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        ensure_support_conversation(db, current_user.id)
    return build_auth_response(current_user)


@api_router.post("/auth/verify-email", response_model=AuthResponse)
def verify_email(payload: EmailVerificationRequest, db: Session = Depends(get_db)):
    token_row = get_active_email_action_token(db, "register_verify", payload.token)
    user = db.query(models.User).filter(models.User.id == token_row.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    now = datetime.now(timezone.utc)
    user.is_email_verified = True
    user.email_verified_at = now
    token_row.used_at = now
    db.commit()
    db.refresh(user)
    return build_auth_response(user)


@api_router.post("/auth/resend-verification", response_model=AuthPendingResponse)
def resend_verification_email(payload: ResendVerificationRequest, request: Request, db: Session = Depends(get_db)):
    enforce_rate_limit(request, "auth-resend-verification")
    normalized_email = payload.email.lower()
    user = db.query(models.User).filter(func.lower(models.User.email) == normalized_email).first()
    if user and not user.is_email_verified:
        try:
            send_registration_verification(db, user)
        except RuntimeError:
            raise HTTPException(
                status_code=503,
                detail="Не удалось отправить письмо подтверждения. Попробуйте позже.",
            )
        db.commit()
    return AuthPendingResponse(
        status="verification_required",
        message="Если аккаунт существует и почта ещё не подтверждена, мы отправили новое письмо",
        email=normalized_email,
    )


@api_router.post("/auth/change-password/request")
def request_password_change(
    payload: ChangePasswordRequest,
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    enforce_rate_limit(request, "auth-change-password")

    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if payload.current_password == payload.new_password:
        raise HTTPException(status_code=400, detail="New password must be different")
    if not current_user.is_email_verified:
        raise HTTPException(status_code=403, detail="Verify your email before changing the password")

    send_password_change_confirmation(db, current_user, hash_password(payload.new_password))
    db.commit()
    return {"status": "confirmation_sent"}


@api_router.post("/auth/change-password/confirm")
def confirm_password_change(payload: EmailVerificationRequest, db: Session = Depends(get_db)):
    token_row = get_active_email_action_token(db, "password_change_confirm", payload.token)
    user = db.query(models.User).filter(models.User.id == token_row.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    token_payload = json.loads(token_row.payload_json or "{}")
    new_password_hash = token_payload.get("new_password_hash")
    if not new_password_hash:
        raise HTTPException(status_code=400, detail="Token payload is invalid")

    token_row.used_at = datetime.now(timezone.utc)
    user.password_hash = new_password_hash
    user.must_change_password = False
    db.commit()
    return {"status": "ok"}


@api_router.get("/chat/conversations", response_model=List[ConversationSummaryResponse])
def list_conversations(
    archived: bool = False,
    current_user: models.User = Depends(require_password_change_completed),
    db: Session = Depends(get_db),
):
    if not current_user.is_admin:
        ensure_support_conversation(db, current_user.id)

    if current_user.is_admin:
        conversations = (
            db.query(models.Conversation)
            .filter(
                or_(
                    models.Conversation.kind == "support",
                    models.Conversation.direct_user_a_id == current_user.id,
                    models.Conversation.direct_user_b_id == current_user.id,
                )
            )
            .order_by(models.Conversation.last_message_at.desc(), models.Conversation.created_at.desc())
            .all()
        )
    else:
        conversations = (
            db.query(models.Conversation)
            .filter(
                or_(
                    models.Conversation.support_user_id == current_user.id,
                    models.Conversation.direct_user_a_id == current_user.id,
                    models.Conversation.direct_user_b_id == current_user.id,
                )
            )
            .order_by(models.Conversation.last_message_at.desc(), models.Conversation.created_at.desc())
            .all()
        )

    return [
        build_conversation_summary(db, current_user, conversation)
        for conversation in conversations
        if get_archive_state(current_user, conversation) == archived and user_can_access_conversation(current_user, conversation)
    ]


@api_router.post("/chat/direct/{target_user_id}", response_model=ConversationDetailResponse)
def get_or_create_direct_chat(
    target_user_id: UUID,
    current_user: models.User = Depends(require_password_change_completed),
    db: Session = Depends(get_db),
):
    if target_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot start a chat with yourself")

    target_user = db.query(models.User).filter(models.User.id == target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    if target_user.is_hidden and not current_user.is_admin:
        raise HTTPException(status_code=404, detail="User not found")

    conversation = (
        db.query(models.Conversation)
        .filter(
            models.Conversation.kind == "direct",
            or_(
                (
                    (models.Conversation.direct_user_a_id == current_user.id)
                    & (models.Conversation.direct_user_b_id == target_user_id)
                ),
                (
                    (models.Conversation.direct_user_a_id == target_user_id)
                    & (models.Conversation.direct_user_b_id == current_user.id)
                ),
            ),
        )
        .first()
    )

    if not conversation:
        conversation = models.Conversation(
            kind="direct",
            direct_user_a_id=current_user.id,
            direct_user_b_id=target_user_id,
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    mark_conversation_read(db, current_user, conversation)
    messages = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.conversation_id == conversation.id)
        .order_by(models.ChatMessage.created_at.asc(), models.ChatMessage.id.asc())
        .all()
    )
    return ConversationDetailResponse(
        id=conversation.id,
        kind=conversation.kind,
        title=get_conversation_title(current_user, conversation, db),
        counterpart_id=get_conversation_counterpart_id(current_user, conversation),
        archived=get_archive_state(current_user, conversation),
        messages=messages,
    )


@api_router.get("/chat/support", response_model=ConversationDetailResponse)
def get_support_chat(
    current_user: models.User = Depends(require_password_change_completed),
    db: Session = Depends(get_db),
):
    if current_user.is_admin:
        raise HTTPException(status_code=400, detail="Admins should open support chats from the conversations list")

    conversation = ensure_support_conversation(db, current_user.id)
    mark_conversation_read(db, current_user, conversation)
    messages = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.conversation_id == conversation.id)
        .order_by(models.ChatMessage.created_at.asc(), models.ChatMessage.id.asc())
        .all()
    )
    return ConversationDetailResponse(
        id=conversation.id,
        kind=conversation.kind,
        title="Техподдержка",
        counterpart_id=None,
        archived=get_archive_state(current_user, conversation),
        messages=messages,
    )


@api_router.get("/chat/conversations/{conversation_id}", response_model=ConversationDetailResponse)
def get_conversation(
    conversation_id: UUID,
    current_user: models.User = Depends(require_password_change_completed),
    db: Session = Depends(get_db),
):
    conversation = db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()
    if not conversation or not user_can_access_conversation(current_user, conversation):
        raise HTTPException(status_code=404, detail="Conversation not found")

    mark_conversation_read(db, current_user, conversation)
    messages = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.conversation_id == conversation.id)
        .order_by(models.ChatMessage.created_at.asc(), models.ChatMessage.id.asc())
        .all()
    )
    return ConversationDetailResponse(
        id=conversation.id,
        kind=conversation.kind,
        title=get_conversation_title(current_user, conversation, db),
        counterpart_id=get_conversation_counterpart_id(current_user, conversation),
        archived=get_archive_state(current_user, conversation),
        messages=messages,
    )


@api_router.post("/chat/conversations/{conversation_id}/messages", response_model=ChatMessageResponse)
def send_chat_message(
    conversation_id: UUID,
    payload: ChatMessageCreate,
    current_user: models.User = Depends(require_password_change_completed),
    db: Session = Depends(get_db),
):
    conversation = db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()
    if not conversation or not user_can_access_conversation(current_user, conversation):
        raise HTTPException(status_code=404, detail="Conversation not found")
    body = payload.body.strip()
    if not body:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    message = models.ChatMessage(
        conversation_id=conversation.id,
        sender_id=current_user.id,
        body=body,
    )
    conversation.last_message_at = datetime.now(timezone.utc)
    conversation.archived_for_user_a = False
    conversation.archived_for_user_b = False
    conversation.archived_for_admin = False
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@api_router.post("/chat/conversations/{conversation_id}/archive")
def archive_conversation(
    conversation_id: UUID,
    payload: ConversationArchiveRequest,
    current_user: models.User = Depends(require_password_change_completed),
    db: Session = Depends(get_db),
):
    conversation = db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()
    if not conversation or not user_can_access_conversation(current_user, conversation):
        raise HTTPException(status_code=404, detail="Conversation not found")

    set_archive_state(current_user, conversation, payload.archived)
    db.commit()
    return {"status": "ok", "archived": payload.archived}


@api_router.get("/admin/users", response_model=List[AdminUserResponse])
def admin_get_users(
    query: Optional[str] = None,
    course: Optional[int] = None,
    department: Optional[str] = None,
    is_profile_complete: Optional[bool] = None,
    is_admin: Optional[bool] = None,
    is_hidden: Optional[bool] = None,
    _: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    users_query = db.query(models.User)
    if query:
        like_query = f"%{query.strip()}%"
        users_query = users_query.filter(
            or_(
                models.User.full_name.ilike(like_query),
                models.User.email.ilike(like_query),
                models.User.department.ilike(like_query),
                models.User.location_name.ilike(like_query),
            )
        )
    if course:
        users_query = users_query.filter(models.User.course == course)
    if department:
        users_query = users_query.filter(models.User.department.ilike(f"%{department}%"))
    if is_profile_complete is not None:
        users_query = users_query.filter(models.User.is_profile_complete == is_profile_complete)
    if is_admin is not None:
        users_query = users_query.filter(models.User.is_admin == is_admin)
    if is_hidden is not None:
        users_query = users_query.filter(models.User.is_hidden == is_hidden)
    return users_query.order_by(models.User.last_active.desc().nullslast(), models.User.full_name.asc()).all()


@api_router.get("/admin/audit-logs", response_model=List[AdminAuditLogResponse])
def admin_get_audit_logs(
    query: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 100,
    _: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    safe_limit = max(1, min(limit, 500))
    logs_query = db.query(models.AdminAuditLog)

    if action:
        logs_query = logs_query.filter(models.AdminAuditLog.action == action)

    if query:
        like_query = f"%{query.strip()}%"
        matching_user_ids = [
            user_id
            for (user_id,) in db.query(models.User.id).filter(
                or_(
                    models.User.full_name.ilike(like_query),
                    models.User.email.ilike(like_query),
                )
            )
        ]
        user_filters = []
        if matching_user_ids:
            user_filters.extend(
                [
                    models.AdminAuditLog.admin_id.in_(matching_user_ids),
                    models.AdminAuditLog.target_user_id.in_(matching_user_ids),
                ]
            )
        logs_query = logs_query.filter(
            or_(
                models.AdminAuditLog.action.ilike(like_query),
                models.AdminAuditLog.details.ilike(like_query),
                *user_filters,
            )
        )

    logs = logs_query.order_by(models.AdminAuditLog.created_at.desc(), models.AdminAuditLog.id.desc()).limit(safe_limit).all()

    admin_ids = sorted({log.admin_id for log in logs})
    target_ids = sorted({log.target_user_id for log in logs if log.target_user_id})
    admin_users = {
        user.id: user
        for user in db.query(models.User).filter(models.User.id.in_(admin_ids)).all()
    } if admin_ids else {}
    target_users = {
        user.id: user
        for user in db.query(models.User).filter(models.User.id.in_(target_ids)).all()
    } if target_ids else {}

    return [build_admin_audit_response(log, admin_users, target_users) for log in logs]


@api_router.patch("/admin/users/{user_id}/admin", response_model=AdminUserResponse)
def admin_update_user_admin_role(
    user_id: UUID,
    payload: AdminRoleUpdateRequest,
    current_admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_admin.id and not payload.is_admin:
        raise HTTPException(status_code=400, detail="You cannot remove admin rights from yourself")

    user.is_admin = payload.is_admin
    write_admin_audit_log(
        db,
        admin_id=current_admin.id,
        action="grant_admin" if payload.is_admin else "revoke_admin",
        target_user_id=user.id,
        details=f"Admin rights set to {payload.is_admin}",
    )
    db.commit()
    db.refresh(user)
    return user


@api_router.patch("/admin/users/{user_id}/visibility", response_model=AdminUserResponse)
def admin_update_user_visibility(
    user_id: UUID,
    payload: AdminVisibilityUpdateRequest,
    current_admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_hidden = payload.is_hidden
    write_admin_audit_log(
        db,
        admin_id=current_admin.id,
        action="hide_user" if payload.is_hidden else "unhide_user",
        target_user_id=user.id,
        details=f"Hidden state set to {payload.is_hidden}",
    )
    db.commit()
    db.refresh(user)
    return user


@api_router.delete("/admin/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_user(
    user_id: UUID,
    current_admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own admin account")

    delete_user_related_data(db, user.id)
    write_admin_audit_log(
        db,
        admin_id=current_admin.id,
        action="delete_user",
        target_user_id=user.id,
        details=f"Deleted user {user.email or user.full_name}",
    )
    db.delete(user)
    db.commit()


@api_router.post("/users/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user: UserCreate,
    _: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    db_user = models.User(**user.model_dump())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    update_search_vector(db, db_user)
    return db_user


@api_router.get("/users/", response_model=List[UserResponse])
def get_users(
    skip: int = 0,
    limit: int = 20,
    course: Optional[int] = None,
    department: Optional[str] = None,
    is_mentor: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.User).filter(models.User.is_profile_complete == True, models.User.is_hidden == False)
    if course:
        query = query.filter(models.User.course == course)
    if department:
        query = query.filter(models.User.department.ilike(f"%{department}%"))
    if is_mentor is not None:
        query = query.filter(models.User.is_mentor == is_mentor)
    return query.offset(skip).limit(limit).all()


@api_router.get("/users/{user_id}", response_model=UserResponse)
def get_user(
    user_id: UUID,
    current_user: Optional[models.User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_hidden and not (current_user and (current_user.is_admin or current_user.id == user.id)):
        raise HTTPException(status_code=404, detail="User not found")
    return user


@api_router.patch("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: UUID,
    user_update: UserUpdate,
    current_user: models.User = Depends(require_password_change_completed),
    db: Session = Depends(get_db),
):
    require_same_user_or_admin(user_id, current_user)

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    payload = user_update.model_dump(exclude_unset=True)
    if "email" in payload:
        new_email = (payload.get("email") or "").lower().strip()
        if new_email and new_email != (user.email or "").lower():
            raise HTTPException(status_code=400, detail="Email cannot be changed directly. Use email verification flow.")
        payload.pop("email", None)
    if "telegram_username" in payload:
        telegram_username = (payload.get("telegram_username") or "").strip()
        payload["telegram_username"] = telegram_username or None
    if not current_user.is_admin:
        payload.pop("is_profile_complete", None)
        payload.pop("is_mentor", None)

    for field, value in payload.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    update_search_vector(db, user)
    return user


@api_router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: UUID,
    current_user: models.User = Depends(require_password_change_completed),
    db: Session = Depends(get_db),
):
    require_same_user_or_admin(user_id, current_user)

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    delete_user_related_data(db, user.id)
    if current_user.is_admin and current_user.id != user.id:
        write_admin_audit_log(
            db,
            admin_id=current_user.id,
            action="delete_user",
            target_user_id=user.id,
            details=f"Deleted user {user.email or user.full_name}",
        )
    db.delete(user)
    db.commit()


@api_router.post("/search/", response_model=List[UserResponse])
def search_users(search: SearchQuery, db: Session = Depends(get_db)):
    return smart_search(db, search)


@api_router.post("/users/{user_id}/tags")
def update_user_tags(
    user_id: UUID,
    tags_data: TagsUpdate,
    current_user: models.User = Depends(require_password_change_completed),
    db: Session = Depends(get_db),
):
    require_same_user_or_admin(user_id, current_user)

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.tags_array = tags_data.tags
    db.commit()
    update_search_vector(db, user)
    return {"status": "ok", "tags": user.tags_array}


@api_router.post("/users/{user_id}/embedding")
def update_user_embedding(
    user_id: UUID,
    emb_data: EmbeddingUpdate,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.semantic_embedding = emb_data.embedding
    write_admin_audit_log(
        db,
        admin_id=current_user.id,
        action="update_embedding",
        target_user_id=user.id,
        details="Semantic embedding refreshed",
    )
    db.commit()
    return {"status": "ok"}


@api_router.post("/reviews/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    review: ReviewCreate,
    current_user: models.User = Depends(require_password_change_completed),
    db: Session = Depends(get_db),
):
    if current_user.id != review.reviewer_id:
        raise HTTPException(status_code=403, detail="You can only create reviews as yourself")

    db_review = models.Review(**review.model_dump())
    db.add(db_review)
    db.commit()
    db.refresh(db_review)

    avg_score = db.query(func.avg(models.Review.score)).filter(models.Review.reviewed_id == review.reviewed_id).scalar()
    user = db.query(models.User).filter(models.User.id == review.reviewed_id).first()
    if user:
        user.trust_score = float(avg_score) if avg_score else 0.0
        db.commit()

    return db_review


@api_router.get("/users/{user_id}/reviews", response_model=List[ReviewResponse])
def get_user_reviews(user_id: UUID, db: Session = Depends(get_db)):
    return db.query(models.Review).filter(models.Review.reviewed_id == user_id).all()


@api_router.post("/onboarding/start", response_model=OnboardingStartResponse)
async def onboarding_start(
    request: Request,
    current_user: models.User = Depends(require_password_change_completed),
):
    enforce_rate_limit(request, "onboarding-start")

    session_id = str(uuid4())
    onboarding_sessions[session_id] = {
        "user_id": str(current_user.id),
        "history": [],
        "accepted_history": [],
        "state": {
            "current_slot": "basic",
            "follow_up_count": {},
            "skipped_slots": [],
        },
    }
    return OnboardingStartResponse(session_id=session_id)


@api_router.post("/dev/seed-users")
def seed_users_endpoint(
    current_admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    created = seed_test_users(db)
    ensure_default_admin()
    ensure_support_conversations_for_existing_users()
    write_admin_audit_log(
        db,
        admin_id=current_admin.id,
        action="seed_users",
        details=f"Seeded {created} users",
    )
    db.commit()
    return {"status": "ok", "created": created}


@api_router.post("/onboarding/chat", response_model=OnboardingChatResponse)
async def onboarding_chat(
    payload: OnboardingChatRequest,
    request: Request,
    current_user: models.User = Depends(require_password_change_completed),
):
    enforce_rate_limit(request, "onboarding-chat")

    session = get_session(payload.session_id)
    if session["user_id"] != str(current_user.id):
        raise HTTPException(status_code=403, detail="This onboarding session belongs to another user")

    history = session["history"]
    accepted_history = session["accepted_history"]
    interview_state = session["state"]
    previous_slot = interview_state.get("current_slot", "basic")
    history.append({"role": "user", "content": payload.text})

    try:
        reply = await get_interviewer_response(history, interview_state)
        is_ready_to_confirm = "[READY_TO_CONFIRM]" in reply
        cleaned_reply = reply.replace("[READY_TO_CONFIRM]", "").strip()

        history.append({"role": "assistant", "content": cleaned_reply})
        if should_persist_onboarding_answer(previous_slot, interview_state):
            accepted_history.append({"role": "user", "content": payload.text})
            accepted_history.append({"role": "assistant", "content": cleaned_reply})
        extracted_data = await extract_profile_data(accepted_history)
        return OnboardingChatResponse(
            reply=cleaned_reply,
            is_ready_to_confirm=is_ready_to_confirm,
            extracted_data=extracted_data,
        )
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Onboarding is unavailable: {exc}") from exc


@api_router.post("/onboarding/confirm", response_model=UserResponse)
async def onboarding_confirm(
    payload: OnboardingConfirmRequest,
    current_user: models.User = Depends(require_password_change_completed),
    db: Session = Depends(get_db),
):
    session = get_session(payload.session_id)
    if session["user_id"] != str(current_user.id):
        raise HTTPException(status_code=403, detail="This onboarding session belongs to another user")

    history = session["accepted_history"] or session["history"]
    interview_state = session["state"]
    extracted_data = await extract_profile_data(history)
    full_name = (extracted_data or {}).get("full_name") or ""
    full_name_parts = [part for part in full_name.split() if part]
    if not extracted_data or len(full_name_parts) < 2 or not extracted_data.get("course"):
        raise HTTPException(status_code=400, detail="Имя, фамилия и курс обязательны для регистрации")

    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.full_name = extracted_data.get("full_name") or user.full_name
    user.telegram_username = None if "telegram" in interview_state.get("skipped_slots", []) else extracted_data.get("telegram_username")
    user.course = extracted_data.get("course") or user.course or 1
    user.department = extracted_data.get("department")
    user.location_name = extracted_data.get("location_name")
    user.bio_raw = extracted_data.get("bio_raw") or user.bio_raw or "Нет описания"
    user.tags_array = extracted_data.get("tags_array") or user.tags_array or []
    user.is_mentor = True
    user.is_hidden = False
    user.is_profile_complete = True

    db.commit()
    db.refresh(user)
    update_search_vector(db, user)
    onboarding_sessions.pop(payload.session_id, None)
    return user


app.include_router(api_router)


@app.get("/openapi.json", include_in_schema=False)
def openapi_schema(_: str = Depends(verify_swagger_credentials)):
    if not SWAGGER_ENABLED:
        raise HTTPException(status_code=404, detail="Not found")
    return get_openapi(title=app.title, version=app.version, routes=app.routes)


@app.get("/docs", include_in_schema=False)
def swagger_ui(_: str = Depends(verify_swagger_credentials)):
    if not SWAGGER_ENABLED:
        raise HTTPException(status_code=404, detail="Not found")
    return get_swagger_ui_html(openapi_url="/openapi.json", title=f"{app.title} - Swagger UI")


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "debug": DEBUG,
        "swagger_enabled": SWAGGER_ENABLED,
        "terms_version": TERMS_VERSION,
        "privacy_policy_version": PRIVACY_POLICY_VERSION,
    }
