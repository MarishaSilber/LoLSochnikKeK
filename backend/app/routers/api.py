from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User, Quote
from ..schemas import UserCreate, UserResponse, QuoteCreate, QuoteResponse

router = APIRouter()


@router.post("/users/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(name=user.name, email=user.email)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.get("/users/", response_model=List[UserResponse])
def get_users(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/quotes/", response_model=QuoteResponse)
def create_quote(quote: QuoteCreate, db: Session = Depends(get_db)):
    db_quote = Quote(text=quote.text, author_id=quote.author_id)
    db.add(db_quote)
    db.commit()
    db.refresh(db_quote)
    return db_quote


@router.get("/quotes/", response_model=List[QuoteResponse])
def get_quotes(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    quotes = db.query(Quote).offset(skip).limit(limit).all()
    return quotes
