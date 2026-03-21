from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import SearchQuery, SearchResult, ParsedRequest, UserCreate, UserResponse
from ..services.llm_parser import parse_student_request
from ..search import search_students
from ..models import User
from typing import List

router = APIRouter()

@router.post("/process-query", response_model=List[SearchResult])
async def process_student_query(query: SearchQuery, db: Session = Depends(get_db)):
    # 1. Парсим запрос через LLM
    parsed_req = await parse_student_request(query.text)

    if not parsed_req:
        raise HTTPException(status_code=500, detail="Failed to parse request with LLM")

    # 2. Ищем студентов в базе
    results = search_students(db, parsed_req)

    return results

@router.get("/health")
def health_check():
    return {"status": "ok"}

# CRUD endpoints для пользователей
@router.post("/users", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(**user.model_dump())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/users", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users
