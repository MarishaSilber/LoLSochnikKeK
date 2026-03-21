from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
import json
from ..database import get_db
from ..models import OnboardingSession, User
from ..schemas import ChatInput, ChatResponse, UserResponse
from ..services.onboarding_agent import get_interviewer_response, extract_profile_data
from typing import Dict, Any

router = APIRouter()

@router.post("/start")
def start_onboarding(db: Session = Depends(get_db)):
    session_id = str(uuid.uuid4())
    new_session = OnboardingSession(id=session_id, chat_history="[]")
    db.add(new_session)
    db.commit()
    return {"session_id": session_id}

@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(input_data: ChatInput, db: Session = Depends(get_db)):
    session = db.query(OnboardingSession).filter(OnboardingSession.id == input_data.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    history = json.loads(session.chat_history)
    history.append({"role": "user", "content": input_data.text})
    
    # Получаем ответ от Gemini-интервьюера
    reply = await get_interviewer_response(history)
    history.append({"role": "assistant", "content": reply})
    
    # Проверяем готовность к подтверждению
    is_ready = "[READY_TO_CONFIRM]" in reply
    clean_reply = reply.replace("[READY_TO_CONFIRM]", "").strip()
    
    # Пытаемся вытащить данные в фоне (Extractor)
    extracted = await extract_profile_data(history)
    
    # Сохраняем прогресс
    session.chat_history = json.dumps(history)
    session.extracted_data = json.dumps(extracted) if extracted else None
    db.commit()
    
    return ChatResponse(
        reply=clean_reply,
        is_ready_to_confirm=is_ready,
        extracted_data=extracted
    )

@router.post("/confirm", response_model=UserResponse)
def confirm_profile(session_id: str, db: Session = Depends(get_db)):
    session = db.query(OnboardingSession).filter(OnboardingSession.id == session_id).first()
    if not session or not session.extracted_data:
        raise HTTPException(status_code=400, detail="Data not ready for confirmation")
        
    data = json.loads(session.extracted_data)
    
    # Создаем полноценного пользователя
    new_user = User(
        full_name=data["full_name"],
        telegram_username=data.get("telegram_username"),
        course=data.get("course"),
        department=data.get("department"),
        location_name=data.get("location_name"),
        bio_raw=data.get("bio_raw"),
        tags_array=data.get("tags_array", []),
        is_mentor=True,
        trust_score=5.0 # Бонус за онбординг!
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Закрываем сессию
    session.is_completed = True
    db.commit()
    
    return new_user
