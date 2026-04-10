import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Optional
from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from . import models
from .database import get_db

ACCESS_TOKEN_TTL_SECONDS = int(os.getenv("ACCESS_TOKEN_TTL_SECONDS", str(60 * 60 * 24)))
SECRET_KEY = os.getenv("SECRET_KEY")
TOKEN_NAMESPACE = "vuzhub-access-token"
EMAIL_TOKEN_NAMESPACE = "vuzhub-email-action"


def ensure_secret_key() -> None:
    if not SECRET_KEY or len(SECRET_KEY) < 32:
        raise RuntimeError("SECRET_KEY must be set and at least 32 characters long")


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000).hex()
    return f"{salt}${hashed}"


def verify_password(password: str, stored_hash: Optional[str]) -> bool:
    if not stored_hash or "$" not in stored_hash:
        return False
    salt, expected_hash = stored_hash.split("$", 1)
    password_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000).hex()
    return hmac.compare_digest(password_hash, expected_hash)


def generate_one_time_token() -> str:
    return secrets.token_urlsafe(32)


def hash_one_time_token(token: str) -> str:
    digest = hmac.new(
        SECRET_KEY.encode("utf-8"),
        f"{EMAIL_TOKEN_NAMESPACE}.{token}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return digest


def verify_one_time_token(token: str, token_hash: str) -> bool:
    return hmac.compare_digest(hash_one_time_token(token), token_hash)


def _sign(payload: dict) -> str:
    encoded_payload = base64.urlsafe_b64encode(
        json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    ).decode("utf-8").rstrip("=")
    signature = hmac.new(
        SECRET_KEY.encode("utf-8"),
        f"{TOKEN_NAMESPACE}.{encoded_payload}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"{encoded_payload}.{signature}"


def issue_access_token(user: models.User) -> str:
    now = int(time.time())
    payload = {
      "sub": str(user.id),
      "email": user.email,
      "is_admin": bool(user.is_admin),
      "must_change_password": bool(user.must_change_password),
      "iat": now,
      "exp": now + ACCESS_TOKEN_TTL_SECONDS,
    }
    return _sign(payload)


def decode_access_token(token: str) -> dict:
    try:
        encoded_payload, signature = token.split(".", 1)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token") from exc

    expected_signature = hmac.new(
        SECRET_KEY.encode("utf-8"),
        f"{TOKEN_NAMESPACE}.{encoded_payload}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(signature, expected_signature):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")

    padding = "=" * (-len(encoded_payload) % 4)
    payload = json.loads(base64.urlsafe_b64decode(f"{encoded_payload}{padding}").decode("utf-8"))
    if int(payload.get("exp", 0)) < int(time.time()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Access token expired")
    return payload


def get_bearer_token(authorization: Optional[str] = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    return authorization.split(" ", 1)[1]


def get_current_user(token: str = Depends(get_bearer_token), db: Session = Depends(get_db)) -> models.User:
    payload = decode_access_token(token)
    user = db.query(models.User).filter(models.User.id == UUID(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def get_optional_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Optional[models.User]:
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.split(" ", 1)[1]
    payload = decode_access_token(token)
    user = db.query(models.User).filter(models.User.id == UUID(payload["sub"])).first()
    return user


def require_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    if current_user.must_change_password:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Password change required before administrative actions",
        )
    return current_user


def require_password_change_completed(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.must_change_password:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Password change required before using the service",
        )
    return current_user
