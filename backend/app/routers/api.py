from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import SearchQuery, SearchResult, ParsedRequest
from ..services.llm_parser import parse_student_request
from ..search import search_students
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
