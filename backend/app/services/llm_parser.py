import json
import os
from typing import Optional
from openai import AsyncOpenAI
from ..schemas import ParsedRequest
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

client = AsyncOpenAI(
    api_key=OPENROUTER_API_KEY,
    base_url=OPENROUTER_BASE_URL,
)

SYSTEM_PROMPT = """> Role: Ты — Backend-парсер для студенческого приложения взаимопомощи. Твоя задача: превратить неструктурированный запрос студента в валидный JSON-объект для поиска в базе данных PostgreSQL.
> Input: Текстовый запрос на русском языке.
> Output Specification: Ты должен вернуть ТОЛЬКО JSON. Никаких пояснений, вступлений и вежливых фраз.
> JSON Schema:
> {
> "course": integer | null, // Номер курса, если упомянут (1-6). Если "магистратура" - ставь 5 или 6.
> "intent_category": string, // Одна из: "study", "job", "life", "emotional_support", "admin" (вопросы по отчислению/документам).
> "tags": string[], // Список из 3-6 ключевых слов в начальной форме (именительный падеж). Например: ["работа", "квантовая_физика", "репетиторство"].
> "location_relevant": boolean, // true, if the user is looking for someone physically (in the lab, GZ, dining room).
> "search_query_normalized": string // Очищенная от мусора строка для полнотекстового поиска (лемматизированная суть запроса).
> }
> Guidelines:
>  * Если запрос про "отчислиться" или "академ" — ставь категорию "admin" или "emotional_support".
>  * Если упоминается конкретная технология (Python, C++, ML) — обязательно выноси её в теги.
>  * Если курс не указан явно, ставь null.
>  * Всегда старайся выделить специфические для МГУ сущности (ГЗ, лабы, названия корпусов).
"""

async def parse_student_request(raw_text: str) -> Optional[ParsedRequest]:
    try:
        response = await client.chat.completions.create(
            model="meta-llama/llama-3.1-8b-instruct", # Или любая другая модель из OpenRouter
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": raw_text}
            ],
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        data = json.loads(content)
        return ParsedRequest(**data)
    except Exception as e:
        print(f"Error parsing request with LLM: {e}")
        return None
