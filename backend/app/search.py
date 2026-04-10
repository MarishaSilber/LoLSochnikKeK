from typing import List

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from .models import User
from .schemas import SearchQuery

WEIGHTS = {"course": 2.0, "department": 0.5, "location": 0.8, "tags": 1.5, "semantic": 1.0, "trust": 0.3, "activity": 0.4}

def smart_search(db: Session, query: SearchQuery) -> List[User]:
    filters = [User.is_profile_complete == True, User.is_hidden == False]
    if query.is_mentor_only: filters.append(User.is_mentor == True)
    if query.course_filter: filters.append(User.course == query.course_filter)
    if query.department_filter: filters.append(User.department.ilike(f"%{query.department_filter}%"))
    base_query = db.query(User).filter(and_(*filters)) if filters else db.query(User)
    if query.query.strip():
        fts_query = func.websearch_to_tsquery("russian", query.query)
        base_query = base_query.filter(User.search_vector.op("@@")(fts_query)).order_by(func.ts_rank(User.search_vector, fts_query).desc())
    return base_query.order_by(User.trust_score.desc(), User.last_active.desc()).limit(query.limit).all()

def update_search_vector(db: Session, user: User):
    if not user.id:
        return

    if user.bio_raw or user.tags_array:
        search_vector = func.to_tsvector("russian", user.bio_raw or "").op("||")(
            func.to_tsvector("russian", " ".join(user.tags_array or []))
        )
    else:
        search_vector = None

    db.query(User).filter(User.id == user.id).update(
        {User.search_vector: search_vector},
        synchronize_session=False,
    )
    db.commit()
    db.refresh(user)
