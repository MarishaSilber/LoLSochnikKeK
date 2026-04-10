from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    email: Optional[EmailStr] = None
    telegram_username: Optional[str] = Field(None, max_length=50)
    course: int = Field(1, ge=1, le=6)
    department: Optional[str] = Field(None, max_length=100)
    is_mentor: bool = False
    is_profile_complete: bool = False
    location_name: Optional[str] = Field(None, max_length=100)
    bio_raw: Optional[str] = None


class UserCreate(UserBase):
    photo_path: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=150)
    email: Optional[EmailStr] = None
    telegram_username: Optional[str] = Field(None, max_length=50)
    course: Optional[int] = Field(None, ge=1, le=6)
    department: Optional[str] = Field(None, max_length=100)
    is_mentor: Optional[bool] = None
    is_profile_complete: Optional[bool] = None
    location_name: Optional[str] = Field(None, max_length=100)
    bio_raw: Optional[str] = None
    photo_path: Optional[str] = None
    tags_array: Optional[List[str]] = None


class UserResponse(UserBase):
    id: UUID
    photo_path: Optional[str] = None
    tags_array: Optional[List[str]] = []
    trust_score: float = 0.0
    last_active: datetime

    class Config:
        from_attributes = True


class AuthRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    accepted_terms: bool
    accepted_privacy_policy: bool


class AuthLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=6, max_length=128)
    new_password: str = Field(..., min_length=6, max_length=128)


class EmailVerificationRequest(BaseModel):
    token: str = Field(..., min_length=20, max_length=512)


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class AuthPendingResponse(BaseModel):
    status: str
    message: str
    email: EmailStr


class AuthResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    is_profile_complete: bool
    is_admin: bool
    must_change_password: bool
    is_email_verified: bool
    access_token: str
    token_type: str = "bearer"


class AdminUserResponse(BaseModel):
    id: UUID
    email: Optional[str] = None
    full_name: str
    course: Optional[int] = None
    department: Optional[str] = None
    location_name: Optional[str] = None
    is_mentor: bool
    is_profile_complete: bool
    is_admin: bool
    is_hidden: bool
    tags_array: Optional[List[str]] = []
    last_active: Optional[datetime] = None

    class Config:
        from_attributes = True


class AdminRoleUpdateRequest(BaseModel):
    is_admin: bool


class AdminVisibilityUpdateRequest(BaseModel):
    is_hidden: bool


class AdminAuditLogResponse(BaseModel):
    id: int
    admin_id: UUID
    admin_name: str
    admin_email: Optional[str] = None
    target_user_id: Optional[UUID] = None
    target_user_name: Optional[str] = None
    target_user_email: Optional[str] = None
    action: str
    details: Optional[str] = None
    created_at: datetime


class TagsUpdate(BaseModel):
    tags: List[str]


class EmbeddingUpdate(BaseModel):
    embedding: List[float] = Field(..., min_length=1536, max_length=1536)


class SearchQuery(BaseModel):
    query: str
    course_filter: Optional[int] = None
    department_filter: Optional[str] = None
    is_mentor_only: bool = False
    limit: int = Field(10, ge=1, le=50)


class ReviewCreate(BaseModel):
    reviewer_id: UUID
    reviewed_id: UUID
    score: float = Field(..., ge=1.0, le=5.0)
    comment: Optional[str] = None


class ReviewResponse(BaseModel):
    id: UUID
    reviewer_id: UUID
    reviewed_id: UUID
    reviewer_name: Optional[str] = None
    score: float
    comment: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ChatMessageCreate(BaseModel):
    body: str = Field(..., min_length=1, max_length=5000)


class ConversationArchiveRequest(BaseModel):
    archived: bool


class ChatMessageResponse(BaseModel):
    id: int
    conversation_id: UUID
    sender_id: UUID
    body: str
    created_at: datetime
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ConversationSummaryResponse(BaseModel):
    id: UUID
    kind: str
    title: str
    counterpart_id: Optional[UUID] = None
    last_message_text: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0
    archived: bool = False


class ConversationDetailResponse(BaseModel):
    id: UUID
    kind: str
    title: str
    counterpart_id: Optional[UUID] = None
    archived: bool = False
    messages: List[ChatMessageResponse]
