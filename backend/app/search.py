from sqlalchemy.orm import Session
from sqlalchemy import text, func, and_
from typing import List, Optional
from .models import User
from .schemas import SearchQuery

WEIGHTS = {"course": 2.0, "department": 0.5, "location": 0.8, "tags": 1.5, "semantic": 1.0, "trust": 0.3, "activity": 0.4}

def smart_search(db: Session, query: SearchQuery) -> List[User]:
    filters = []
    if query.is_mentor_only: filters.append(User.is_mentor == True)
    if query.course_filter: filters.append(User.course == query.course_filter)
    if query.department_filter: filters.append(User.department.ilike(f"%{query.department_filter}%"))
    base_query = db.query(User).filter(and_(*filters)) if filters else db.query(User)
    if query.query.strip():
        fts_query = func.websearch_to_tsquery("russian", query.query)
        base_query = base_query.filter(User.search_vector.op("@@")(fts_query)).order_by(func.ts_rank(User.search_vector, fts_query).desc())
    return base_query.order_by(User.trust_score.desc(), User.last_active.desc()).limit(query.limit).all()

def update_search_vector(db: Session, user: User):
    if user.bio_raw or user.tags_array:
        user.search_vector = func.to_tsvector("russian", user.bio_raw or "").op("||")(func.to_tsvector("russian", " ".join(user.tags_array or [])))
        db.commit()

def create_index_statements() -> List[str]:
    return ["CREATE EXTENSION IF NOT EXISTS vector;", "CREATE EXTENSION IF NOT EXISTS pg_trgm;", "CREATE INDEX IF NOT EXISTS idx_users_search_vector ON users USING GIN(search_vector);"]
