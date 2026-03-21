from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .database import engine, get_db
from . import models
from .schemas import UserCreate, UserResponse, QuoteCreate, QuoteResponse, SearchQuery
from .search import smart_search

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="LoLSochnikKeK API", version="1.0.0")


@app.post("/users/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = models.User(name=user.name, email=user.email)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.get("/users/", response_model=List[UserResponse])
def get_users(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users


@app.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.post("/quotes/", response_model=QuoteResponse)
def create_quote(quote: QuoteCreate, db: Session = Depends(get_db)):
    db_quote = models.Quote(text=quote.text, author_id=quote.author_id)
    db.add(db_quote)
    db.commit()
    db.refresh(db_quote)
    return db_quote


@app.get("/quotes/", response_model=List[QuoteResponse])
def get_quotes(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    quotes = db.query(models.Quote).offset(skip).limit(limit).all()
    return quotes


@app.post("/search/", response_model=List[QuoteResponse])
def search_quotes(search: SearchQuery, db: Session = Depends(get_db)):
    results = smart_search(db, search.query)
    return results


@app.get("/health")
def health_check():
    return {"status": "ok"}
