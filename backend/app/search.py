from sqlalchemy.orm import Session
from sqlalchemy import func, select, desc
from .models import User
from .schemas import ParsedRequest, SearchResult
from typing import List
import datetime

def search_students(db: Session, parsed_req: ParsedRequest) -> List[SearchResult]:
    # 1. Базовый фильтр: только менторы (активные пользователи)
    query = select(User).where(User.is_mentor == True)
    
    results = db.execute(query).scalars().all()
    
    search_results = []
    now = datetime.datetime.utcnow()
    
    for user in results:
        score = 0.0
        
        # 1. Вес: Course (2.0)
        if user.course and parsed_req.course:
            if user.course == parsed_req.course:
                score += 2.0
            elif abs(user.course - parsed_req.course) <= 1:
                score += 1.0 # Близкий курс
        
        # 2. Вес: Tags (1.5 за совпадение каждого тега)
        common_tags = set(user.tags_array or []) & set(parsed_req.tags)
        score += len(common_tags) * 1.5
        
        # 3. Вес: Location (0.8)
        # Если в запросе упоминается локация и она совпадает
        if user.location_name and parsed_req.location_relevant:
            # Упрощенная проверка вхождения (в будущем через LLM локацию)
            if user.location_name.lower() in parsed_req.search_query_normalized.lower():
                score += 0.8
        
        # 4. Вес: Trust Score (0.3)
        score += (user.trust_score or 0.0) * 0.3
        
        # 5. Вес: Recency (0.4)
        if user.last_active:
            days_diff = (now - user.last_active).days
            if days_diff < 1: score += 0.4
            elif days_diff < 7: score += 0.2
            
        # 6. Текстовый ранг (добавим к итогу)
        # В будущем можно добавить Semantic Embedding (1.0)
        
        search_results.append(SearchResult(
            user=user,
            score=float(score)
        ))
        
    # Сортируем по убыванию score
    search_results.sort(key=lambda x: x.score, reverse=True)
    
    return search_results
