import json
import os
from typing import List, Dict, Optional
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

client = AsyncOpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1",
)

MODEL_NAME = "google/gemini-2.5-flash-lite"

INTERVIEWER_PROMPT = """Ты — дружелюбный AI-рекрутер студенческого сервиса PhysFac MSU. Твоя задача — в ходе живой беседы познакомиться со студентом и заполнить его профиль ментора.

ПРАВИЛА:
1. Будь краток, задавай по 1-2 вопроса за раз. Используй "ты", будь неформален.
2. Твоя цель узнать: ФИО, курс (1-6), кафедру, любимую локацию (напр. ГЗ, 5-18, лаба), чем он может помочь (скиллы для тегов) и его Telegram.
3. Если он говорит "привет", начни с приветствия и спроси, как его зовут и на каком он курсе.
4. Знаешь специфику Физфака: матан Савченко, кванты, ГЗ, столовки, корпуса.
5. Когда ты узнаешь достаточно (ФИО, курс, кафедра и скиллы), закончи диалог фразой: "[READY_TO_CONFIRM]".

ВАЖНО: Пиши ТОЛЬКО текст ответа пользователю.
"""

EXTRACTOR_PROMPT = """Ты — аналитик. Твоя задача: из лога чата вытащить данные профиля студента по схеме JSON.

СХЕМА:
{
  "full_name": string,
  "telegram_username": string | null,
  "course": integer | null,
  "department": string | null,
  "location_name": string | null,
  "bio_raw": string, // Суть его опыта одной фразой
  "tags_array": string[] // Список тегов в именит. падеже (матан, C++, ML и т.д.)
}

Guidelines:
- Если что-то не упомянуто, ставь null.
- Из текста "я работаю в яндексе" вытащи тег "Яндекс".
- Из текста "сдавал Савченко" вытащи теги "матан", "Савченко".
"""

async def get_interviewer_response(chat_history: List[Dict[str, str]]) -> str:
    messages = [{"role": "system", "content": INTERVIEWER_PROMPT}] + chat_history
    
    response = await client.chat.completions.create(
        model=MODEL_NAME,
        messages=messages,
        temperature=0.7
    )
    return response.choices[0].message.content

async def extract_profile_data(chat_history: List[Dict[str, str]]) -> Optional[dict]:
    # Превращаем историю в один текст
    chat_log = "\n".join([f"{m['role']}: {m['content']}" for m in chat_history])
    
    response = await client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": EXTRACTOR_PROMPT},
            {"role": "user", "content": f"LOG:\n{chat_log}"}
        ],
        response_format={"type": "json_object"}
    )
    try:
        return json.loads(response.choices[0].message.content)
    except:
        return None
