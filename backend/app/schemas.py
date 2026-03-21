from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class UserBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    telegram_username: Optional[str] = Field(None, max_length=50)
    course: int = Field(1, ge=1, le=6)
    department: Optional[str] = Field(None, max_length=100)
    is_mentor: bool = False
    location_name: Optional[str] = Field(None, max_length=100)
    bio_raw: Optional[str] = None

class UserCreate(UserBase):
    photo_path: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    telegram_username: Optional[str] = None
    course: Optional[int] = None
    department: Optional[str] = None
    is_mentor: Optional[bool] = None
    location_name: Optional[str] = None
    bio_raw: Optional[str] = None
    photo_path: Optional[str] = None

class UserResponse(UserBase):
    id: UUID
    photo_path: Optional[str] = None
    tags_array: Optional[List[str]] = []
    trust_score: float = 0.0
    last_active: datetime
    class Config:
        from_attributes = True

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
    score: float
    comment: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True
