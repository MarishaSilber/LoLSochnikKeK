from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
import datetime


class ParsedRequest(BaseModel):
    course: Optional[int] = Field(None, ge=1, le=6)
    intent_category: str
    tags: List[str]
    location_relevant: bool
    search_query_normalized: str


class UserBase(BaseModel):
    full_name: str
    telegram_username: Optional[str] = None
    photo_path: Optional[str] = None
    course: Optional[int] = None
    department: Optional[str] = None
    is_mentor: bool = True
    location_name: Optional[str] = None
    bio_raw: Optional[str] = None
    tags_array: List[str] = []
    trust_score: float = 0.0
    last_active: Optional[datetime.datetime] = None


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True


class SearchQuery(BaseModel):
    text: str


class SearchResult(BaseModel):
    user: UserResponse
    score: float
