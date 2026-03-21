from sqlalchemy.orm import Session
from sqlalchemy import or_
from .models import Quote
import re


def smart_search(db: Session, query: str) -> list:
    """
    Умный поиск цитат.
    Ищет совпадения в тексте цитаты с поддержкой частичных совпадений.
    """
    if not query.strip():
        return db.query(Quote).limit(10).all()

    search_term = f"%{query}%"
    results = db.query(Quote).filter(
        or_(
            Quote.text.ilike(search_term),
        )
    ).limit(10).all()

    if not results:
        words = query.split()
        for word in words:
            partial_term = f"%{word}%"
            partial_results = db.query(Quote).filter(
                Quote.text.ilike(partial_term)
            ).limit(10).all()
            if partial_results:
                return partial_results

    return results
