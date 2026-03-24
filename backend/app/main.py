from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List, Optional
from uuid import UUID
from .database import engine, get_db
from . import models
from .schemas import UserCreate, UserResponse, UserUpdate, SearchQuery, TagsUpdate, EmbeddingUpdate, ReviewCreate, ReviewResponse
from .search import smart_search, update_search_vector, create_index_statements

models.Base.metadata.create_all(bind=engine)
app = FastAPI(title="LoLSochnikKeK API", version="2.0.0", openapi_url="/openapi.json")

# CORS для frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Router с префиксом
from fastapi import APIRouter
api_router = APIRouter(prefix="/api/v1")

@api_router.post("/users/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = models.User(**user.model_dump()); db.add(db_user); db.commit(); db.refresh(db_user); update_search_vector(db, db_user); return db_user

@api_router.get("/users/", response_model=List[UserResponse])
def get_users(skip: int = 0, limit: int = 20, course: Optional[int] = None, department: Optional[str] = None, is_mentor: Optional[bool] = None, db: Session = Depends(get_db)):
    query = db.query(models.User)
    if course: query = query.filter(models.User.course == course)
    if department: query = query.filter(models.User.department.ilike(f"%{department}%"))
    if is_mentor is not None: query = query.filter(models.User.is_mentor == is_mentor)
    return query.offset(skip).limit(limit).all()

@api_router.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: UUID, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.patch("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: UUID, user_update: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    for field, value in user_update.model_dump(exclude_unset=True).items(): setattr(user, field, value)
    db.commit(); db.refresh(user); update_search_vector(db, user); return user

@api_router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: UUID, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    db.delete(user); db.commit()

@api_router.post("/search/", response_model=List[UserResponse])
def search_users(search: SearchQuery, db: Session = Depends(get_db)): return smart_search(db, search)

@api_router.post("/users/{user_id}/tags")
def update_user_tags(user_id: UUID, tags_data: TagsUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    user.tags_array = tags_data.tags; db.commit(); update_search_vector(db, user); return {"status": "ok", "tags": user.tags_array}

@api_router.post("/users/{user_id}/embedding")
def update_user_embedding(user_id: UUID, emb_data: EmbeddingUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    user.semantic_embedding = emb_data.embedding; db.commit(); return {"status": "ok"}

@api_router.post("/reviews/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(review: ReviewCreate, db: Session = Depends(get_db)):
    db_review = models.Review(**review.model_dump()); db.add(db_review); db.commit(); db.refresh(db_review)
    avg_score = db.query(func.avg(models.Review.score)).filter(models.Review.reviewed_id == review.reviewed_id).scalar()
    user = db.query(models.User).filter(models.User.id == review.reviewed_id).first()
    if user: user.trust_score = float(avg_score) if avg_score else 0.0; db.commit()
    return db_review

@api_router.get("/users/{user_id}/reviews", response_model=List[ReviewResponse])
def get_user_reviews(user_id: UUID, db: Session = Depends(get_db)): return db.query(models.Review).filter(models.Review.reviewed_id == user_id).all()

app.include_router(api_router)

@app.on_event("startup")
def on_startup():
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm;"))
        for stmt in create_index_statements(): conn.execute(text(stmt))
        conn.commit()

@app.get("/health")
def health_check(): return {"status": "ok"}
