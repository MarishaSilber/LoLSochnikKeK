from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from uuid import UUID
from .database import engine, get_db
from . import models
from .schemas import UserCreate, UserResponse, UserUpdate, SearchQuery, TagsUpdate, EmbeddingUpdate, ReviewCreate, ReviewResponse
from .search import smart_search, update_search_vector, create_index_statements

models.Base.metadata.create_all(bind=engine)
app = FastAPI(title="LoLSochnikKeK API", version="2.0.0")

@app.on_event("startup")
def on_startup():
    with engine.connect() as conn:
        for stmt in create_index_statements(): conn.execute(stmt)
        conn.commit()

@app.post("/users/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = models.User(**user.model_dump()); db.add(db_user); db.commit(); db.refresh(db_user); update_search_vector(db, db_user); return db_user

@app.get("/users/", response_model=List[UserResponse])
def get_users(skip: int = 0, limit: int = 20, course: Optional[int] = None, department: Optional[str] = None, is_mentor: Optional[bool] = None, db: Session = Depends(get_db)):
    query = db.query(models.User)
    if course: query = query.filter(models.User.course == course)
    if department: query = query.filter(models.User.department.ilike(f"%{department}%"))
    if is_mentor is not None: query = query.filter(models.User.is_mentor == is_mentor)
    return query.offset(skip).limit(limit).all()

@app.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: UUID, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    return user

@app.patch("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: UUID, user_update: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    for field, value in user_update.model_dump(exclude_unset=True).items(): setattr(user, field, value)
    db.commit(); db.refresh(user); update_search_vector(db, user); return user

@app.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: UUID, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    db.delete(user); db.commit()

@app.post("/search/", response_model=List[UserResponse])
def search_users(search: SearchQuery, db: Session = Depends(get_db)): return smart_search(db, search)

@app.post("/users/{user_id}/tags")
def update_user_tags(user_id: UUID, tags_data: TagsUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    user.tags_array = tags_data.tags; db.commit(); update_search_vector(db, user); return {"status": "ok", "tags": user.tags_array}

@app.post("/users/{user_id}/embedding")
def update_user_embedding(user_id: UUID, emb_data: EmbeddingUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    user.semantic_embedding = emb_data.embedding; db.commit(); return {"status": "ok"}

@app.post("/reviews/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(review: ReviewCreate, db: Session = Depends(get_db)):
    db_review = models.Review(**review.model_dump()); db.add(db_review); db.commit(); db.refresh(db_review)
    avg_score = db.query(func.avg(models.Review.score)).filter(models.Review.reviewed_id == review.reviewed_id).scalar()
    user = db.query(models.User).filter(models.User.id == review.reviewed_id).first()
    if user: user.trust_score = float(avg_score) if avg_score else 0.0; db.commit()
    return db_review

@app.get("/users/{user_id}/reviews", response_model=List[ReviewResponse])
def get_user_reviews(user_id: UUID, db: Session = Depends(get_db)): return db.query(models.Review).filter(models.Review.reviewed_id == user_id).all()

@app.get("/health")
def health_check(): return {"status": "ok"}
