from pydantic import BaseModel, EmailStr
from typing import Optional, List


class QuoteBase(BaseModel):
    text: str


class QuoteCreate(QuoteBase):
    author_id: int


class QuoteResponse(QuoteBase):
    id: int
    author_id: int

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    name: str
    email: EmailStr


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    id: int
    quotes: List[QuoteResponse] = []

    class Config:
        from_attributes = True


class SearchQuery(BaseModel):
    query: str
