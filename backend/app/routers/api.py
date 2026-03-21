from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from uuid import UUID
from ..database import get_db
from ..models import User, Review
from ..schemas import UserCreate, UserResponse, UserUpdate, SearchQuery, TagsUpdate, EmbeddingUpdate, ReviewCreate, ReviewResponse
from ..search import smart_search, update_search_vector

router = APIRouter()

@router.post("/users/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(**user.model_dump()); db.add(db_user); db.commit(); db.refresh(db_user); update_search_vector(db, db_user); return db_user

@router.get("/users/", response_model=List[UserResponse])
def get_users(skip: int = 0, limit: int = 20, course: Optional[int] = None, department: Optional[str] = None, is_mentor: Optional[bool] = None, db: Session = Depends(get_db)):
    query = db.query(User)
    if course: query = query.filter(User.course == course)
    if department: query = query.filter(User.department.ilike(f"%{department}%"))
    if is_mentor is not None: query = query.filter(User.is_mentor == is_mentor)
    return query.offset(skip).limit(limit).all()

@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: UUID, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    return user

@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: UUID, user_update: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    for field, value in user_update.model_dump(exclude_unset=True).items(): setattr(user, field, value)
    db.commit(); db.refresh(user); update_search_vector(db, user); return user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: UUID, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    db.delete(user); db.commit()

@router.post("/search/", response_model=List[UserResponse])
def search_users(search: SearchQuery, db: Session = Depends(get_db)): return smart_search(db, search)

@router.post("/users/{user_id}/tags")
def update_user_tags(user_id: UUID, tags_data: TagsUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    user.tags_array = tags_data.tags; db.commit(); update_search_vector(db, user); return {"status": "ok", "tags": user.tags_array}

@router.post("/users/{user_id}/embedding")
def update_user_embedding(user_id: UUID, emb_data: EmbeddingUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    user.semantic_embedding = emb_data.embedding; db.commit(); return {"status": "ok"}

@router.post("/reviews/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(review: ReviewCreate, db: Session = Depends(get_db)):
    db_review = Review(**review.model_dump()); db.add(db_review); db.commit(); db.refresh(db_review)
    avg_score = db.query(func.avg(Review.score)).filter(Review.reviewed_id == review.reviewed_id).scalar()
    user = db.query(User).filter(User.id == review.reviewed_id).first()
    if user: user.trust_score = float(avg_score) if avg_score else 0.0; db.commit()
    return db_review

@router.get("/users/{user_id}/reviews", response_model=List[ReviewResponse])
def get_user_reviews(user_id: UUID, db: Session = Depends(get_db)): return db.query(Review).filter(Review.reviewed_id == user_id).all()
