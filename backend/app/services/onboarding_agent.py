import json
import os
import re
from typing import Dict, List, Optional

import httpx
from dotenv import load_dotenv

load_dotenv()

YANDEX_API_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"
YANDEX_API_KEY = os.getenv("YANDEX_API_KEY")
YANDEX_FOLDER_ID = os.getenv("YANDEX_FOLDER_ID")
MODEL_URI = os.getenv("YANDEX_MODEL_URI") or (
    f"gpt://{YANDEX_FOLDER_ID}/yandexgpt/latest" if YANDEX_FOLDER_ID else None
)

MEPHI_LOCATIONS = [
    "НЛК",
    "Столовая НЛК",
    "Буфет К-корпус",
    "Столовая Г-корпус 1 этаж",
    "Столовая Г-корпус 2 этаж",
    "Буфет",
    "Г-корпус",
    "А-корпус",
    "С-корпус",
    "Т-корпус",
    "В-корпус",
    "Футбольное поле",
    "Скалодром",
    "Общага",
    "КПП",
    "Студофис",
    "Э-корпус",
    "Д-корпус",
    "К-корпус",
    "Технопарк",
    "45/44",
    "33/И-корпус",
    "6a",
    "7a",
    "47б",
    "Р/31",
]

LOCATION_ALIASES = {
    "читалка": "НЛК",
    "читалка 4 этаж": "НЛК",
    "коворкинг": "Технопарк",
    "коворкинг 5-18": "Технопарк",
    "гз": "Г-корпус",
    "деканат": "Студофис",
    "ниияф": "Э-корпус",
    "оияи": "45/44",
    "вмк": "33/И-корпус",
    "стадион мгу": "Футбольное поле",
    "столовая №1": "Столовая НЛК",
}

SKIP_PHRASES = {
    "пропустить",
    "скип",
    "skip",
    "не хочу отвечать",
    "не хочу",
    "без ответа",
    "__skip__",
}

SLOTS = ["basic", "department", "location", "help", "telegram"]
REQUIRED_SLOTS = {"basic"}

TAG_RULES = [
    ("ВышМат", ["матан", "диффур", "термех", "линал", "тензор"]),
    ("Физика", ["квант", "физик", "оптик", "фотоник", "лабы", "эксперимент"]),
    ("Программирование", ["python", "c++", "java", "ml", "ds", "data science", "код", "алгоритм"]),
    ("Стажировки", ["стаж", "резюме", "собес", "кейс", "карьер", "консалт", "стартап", "продукт"]),
    ("Документы", ["документ", "академ", "комисс", "стипенд", "грант", "заявк", "перевод"]),
    ("Адаптация", ["адаптац", "общага", "кампус", "первокурс", "жиль", "быт"]),
    ("Разговор", ["поддерж", "выгора", "психолог", "разговор", "стресс"]),
]

EXTRACTOR_PROMPT = """Извлеки из диалога данные профиля и верни только JSON.

Схема:
{
  "full_name": string | null,
  "telegram_username": string | null,
  "course": integer | null,
  "department": string | null,
  "location_name": string | null,
  "bio_raw": string | null,
  "tags_array": string[]
}
"""


def ensure_yandex_config() -> None:
    if not YANDEX_API_KEY:
        raise RuntimeError("YANDEX_API_KEY is not configured")
    if not MODEL_URI:
        raise RuntimeError("YANDEX_FOLDER_ID or YANDEX_MODEL_URI is not configured")


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().lower())


def is_skip_message(text: str) -> bool:
    normalized = normalize_text(text)
    return normalized in SKIP_PHRASES


def parse_completion_text(payload: dict) -> str:
    alternatives = payload.get("result", {}).get("alternatives", [])
    if not alternatives:
        raise RuntimeError("Yandex model returned no alternatives")
    return alternatives[0].get("message", {}).get("text", "").strip()


async def yandex_completion(messages: List[Dict[str, str]], temperature: float = 0.2) -> str:
    ensure_yandex_config()

    request_body = {
        "modelUri": MODEL_URI,
        "completionOptions": {
            "stream": False,
            "temperature": temperature,
            "maxTokens": 1200,
        },
        "messages": messages,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            YANDEX_API_URL,
            headers={
                "Authorization": f"Api-Key {YANDEX_API_KEY}",
                "Content-Type": "application/json",
            },
            json=request_body,
        )
        if not response.is_success:
            raise RuntimeError(f"Yandex API error {response.status_code}: {response.text[:500]}")
        return parse_completion_text(response.json())


def collect_user_messages(chat_history: List[Dict[str, str]]) -> List[str]:
    return [message["content"] for message in chat_history if message.get("role") == "user"]


def extract_full_name(text: str) -> Optional[str]:
    patterns = [
        r"(?:меня зовут|я)\s+([А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ][а-яё]+){1,2})",
        r"\b([А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ][а-яё]+){1,2})\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1).strip()
    return None


def has_full_name(value: Optional[str]) -> bool:
    if not value:
        return False
    parts = [part for part in re.split(r"\s+", value.strip()) if part]
    return len(parts) >= 2


def extract_course(text: str) -> Optional[int]:
    match = re.search(r"\b([1-6])\s*(?:курс|курсе|курса)?\b", text.lower())
    if match:
        return int(match.group(1))
    return None


def extract_telegram(text: str) -> Optional[str]:
    match = re.search(r"@\w{4,}", text)
    return match.group(0) if match else None


def extract_department(text: str) -> Optional[str]:
    patterns = [
        r"(?:кафедра|направление|факультет)\s*[:\-]?\s*([A-Za-zА-Яа-яЁё0-9/\-\s]{3,80})",
        r"(?:учусь на|я с|я из)\s+([A-Za-zА-Яа-яЁё0-9/\-\s]{3,80})",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            value = re.split(r"[,.!\n]", match.group(1).strip())[0].strip(" -")
            if value:
                return value[:100]
    return None


def extract_location(text: str) -> Optional[str]:
    normalized = normalize_text(text)
    for location in MEPHI_LOCATIONS:
        if normalize_text(location) in normalized:
            return location
    for alias, mapped in LOCATION_ALIASES.items():
        if alias in normalized:
            return mapped
    return None


def extract_tags(text: str) -> List[str]:
    normalized = normalize_text(text)
    tags = [label for label, patterns in TAG_RULES if any(pattern in normalized for pattern in patterns)]
    return tags[:4]


def build_bio(text: str, tags: List[str]) -> Optional[str]:
    cleaned = re.sub(r"@\w{4,}", "", text)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    if cleaned:
        sentence = cleaned[:220].rstrip(" ,.;:")
        if len(sentence) > 25:
            return sentence
    if tags:
        return f"Помогу по темам: {', '.join(tags[:3])}."
    return None


def heuristic_extract_profile_data(chat_history: List[Dict[str, str]]) -> dict:
    user_messages = [message for message in collect_user_messages(chat_history) if not is_skip_message(message)]
    full_text = "\n".join(user_messages)

    full_name = None
    course = None
    telegram_username = None
    department = None
    location_name = None
    tags_array: List[str] = []

    for message in user_messages:
        full_name = full_name or extract_full_name(message)
        course = course or extract_course(message)
        telegram_username = telegram_username or extract_telegram(message)
        department = department or extract_department(message)
        location_name = location_name or extract_location(message)
        for tag in extract_tags(message):
            if tag not in tags_array:
                tags_array.append(tag)

    return {
        "full_name": full_name,
        "telegram_username": telegram_username,
        "course": course,
        "department": department,
        "location_name": location_name,
        "bio_raw": build_bio(full_text, tags_array),
        "tags_array": tags_array,
    }


def is_slot_filled(slot: str, data: dict) -> bool:
    if slot == "basic":
        return bool(has_full_name(data.get("full_name")) and data.get("course"))
    if slot == "department":
        return bool(data.get("department"))
    if slot == "location":
        return bool(data.get("location_name"))
    if slot == "help":
        return bool((data.get("bio_raw") and len(data["bio_raw"]) > 25) and len(data.get("tags_array") or []) >= 1)
    if slot == "telegram":
        return bool(data.get("telegram_username"))
    return False


def init_interview_state(state: Optional[dict]) -> dict:
    state = state or {}
    state.setdefault("current_slot", "basic")
    state.setdefault("follow_up_count", {})
    state.setdefault("skipped_slots", [])
    return state


def next_unfilled_slot(data: dict, state: dict) -> Optional[str]:
    for slot in SLOTS:
        if slot in state["skipped_slots"]:
            continue
        if not is_slot_filled(slot, data):
            return slot
    return None


def base_question_for_slot(slot: str) -> str:
    if slot == "basic":
        return "Давай начнем с базы: как тебя зовут и на каком ты курсе?"
    if slot == "department":
        return "Какое у тебя направление, кафедра или факультет в МИФИ?"
    if slot == "location":
        return "Где тебя обычно можно найти на кампусе? Можно одной локацией, например НЛК, Г-корпус или Технопарк."
    if slot == "help":
        return "С чем ты реально можешь помочь другим студентам? Напиши коротко про темы, опыт, сложные предметы, стажировки или бытовые вопросы."
    if slot == "telegram":
        return "Напиши свой Telegram в формате @username. Если не хочешь указывать, можешь нажать «Пропустить»."
    return "Расскажи чуть подробнее."


def follow_up_question_for_slot(slot: str) -> str:
    if slot == "basic":
        return "Пока не хватает двух вещей: имени и курса. Ответь в формате вроде «Иван Петров, 2 курс»."
    if slot == "department":
        return "Нужно чуть точнее: как называется твое направление или кафедра? Можно коротко, например «Прикладная математика»."
    if slot == "location":
        return "Хочу понять, где тебя искать. Назови одну конкретную локацию: НЛК, К-корпус, Общага, Студофис и так далее."
    if slot == "help":
        return "Пока слишком общо. Напиши 2-3 конкретные темы, по которым к тебе можно обращаться, например предметы, стажировки, документы или адаптация."
    if slot == "telegram":
        return "Нужен либо Telegram в формате @username, либо просто нажми «Пропустить»."
    return "Можешь уточнить чуть подробнее?"


def update_state_from_message(state: dict, slot: str, message_text: str, data: dict) -> None:
    if is_skip_message(message_text):
        if slot in REQUIRED_SLOTS:
            state["follow_up_count"][slot] = state["follow_up_count"].get(slot, 0) + 1
            return
        if slot not in state["skipped_slots"]:
            state["skipped_slots"].append(slot)
        state["follow_up_count"][slot] = 0
        return

    if is_slot_filled(slot, data):
        state["follow_up_count"][slot] = 0
        return

    state["follow_up_count"][slot] = state["follow_up_count"].get(slot, 0) + 1


def build_deterministic_response(chat_history: List[Dict[str, str]], interview_state: Optional[dict]) -> str:
    state = init_interview_state(interview_state)
    data = heuristic_extract_profile_data(chat_history)
    user_messages = collect_user_messages(chat_history)
    last_user_message = user_messages[-1] if user_messages else ""
    current_slot = state.get("current_slot", "basic")

    if user_messages:
        update_state_from_message(state, current_slot, last_user_message, data)

    if user_messages and is_skip_message(last_user_message) and current_slot in REQUIRED_SLOTS:
        state["current_slot"] = current_slot
        return "Имя, фамилию и курс пропускать нельзя. Напиши их в формате вроде «Иван Петров, 2 курс»."

    current_slot = next_unfilled_slot(data, state)
    if current_slot is None:
        state["current_slot"] = "done"
        if data.get("telegram_username") or "telegram" in state["skipped_slots"]:
            return "Все собрал. Проверяй профиль и публикуем. [READY_TO_CONFIRM]"
        state["current_slot"] = "telegram"
        return base_question_for_slot("telegram")

    state["current_slot"] = current_slot
    follow_up_count = state["follow_up_count"].get(current_slot, 0)

    if current_slot == "telegram" and current_slot in state["skipped_slots"]:
        state["current_slot"] = "done"
        return "Все собрал. Проверяй профиль и публикуем. [READY_TO_CONFIRM]"

    if follow_up_count > 0:
        return follow_up_question_for_slot(current_slot)

    return base_question_for_slot(current_slot)


async def get_interviewer_response(chat_history: List[Dict[str, str]], interview_state: Optional[dict] = None) -> str:
    return build_deterministic_response(chat_history, interview_state)


async def extract_profile_data(chat_history: List[Dict[str, str]]) -> Optional[dict]:
    chat_log = "\n".join(f"{message['role']}: {message['content']}" for message in chat_history)
    messages = [
        {"role": "system", "text": EXTRACTOR_PROMPT},
        {
            "role": "user",
            "text": f"Лог диалога:\n{chat_log}\n\nВерни только JSON без пояснений.",
        },
    ]

    try:
        response_text = await yandex_completion(messages, temperature=0.0)
        start = response_text.find("{")
        end = response_text.rfind("}")
        if start == -1 or end == -1:
            return heuristic_extract_profile_data(chat_history)
        return json.loads(response_text[start : end + 1])
    except Exception:
        return heuristic_extract_profile_data(chat_history)
