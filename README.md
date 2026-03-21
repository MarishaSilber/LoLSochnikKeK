# LoLSochnikKeK (PhysFac MSU Edition) 🚀

Приложение для взаимопомощи студентов Физфака МГУ. Система превращает неструктурированный запрос (напр. *"кто в ГЗ шарит в квантах?"*) в структурированный поиск по базе менторов с использованием ИИ.

## 🧠 Как это работает

Система построена на двухэтапном конвейере:

1. **LLM Parsing (Gemini 2.5 Flash Lite):** 
   Сырой текст студента отправляется в нейросеть с кастомным System Prompt. На выходе получаем JSON с категорией, курсом, нормализованной сутью и списком тегов.
   
2. **Weighted Search (PostgreSQL):**
   Поиск по базе менторов (20+ профилей) происходит с учетом весовых коэффициентов релевантности:
   - **Course (2.0):** Совпадение курса — самый сильный сигнал.
   - **Tags (1.5):** Каждое совпадение ключевого слова (напр. *Савченко*, *ML*, *ГЗ*).
   - **Location (0.8):** Если человек физически находится в нужном месте.
   - **Trust Score (0.3):** Карма пользователя.
   - **Recency (0.4):** Бонус за недавнюю активность в системе.

## 🛠 Стек технологий

- **Backend:** FastAPI (Python 3.11)
- **Database:** PostgreSQL + **pgvector** (для будущего семантического поиска)
- **LLM:** Google Gemini 2.5 Flash Lite (через OpenRouter)
- **Deployment:** Docker + Docker Compose

## 🚀 Быстрый запуск

### 1. Подготовка окружения
Создайте файл `backend/.env` и добавьте свой ключ:
```env
OPENROUTER_API_KEY=your_key_here
DATABASE_URL=postgresql+psycopg2://testuser:test1234@db:5432/testdb
```

### 2. Запуск через Docker
```bash
docker-compose up -d --build
```
*При первом запуске база данных автоматически наполнится 20 тестовыми профилями студентов Физфака.*

### 3. Проверка API
Эндпоинт для обработки запросов: `POST http://localhost:8000/api/v1/process-query`

**Пример запроса (curl):**
```bash
curl -X POST http://localhost:8000/api/v1/process-query \
     -H "Content-Type: application/json" \
     -d '{"text": "Как не вылететь с физфака на 2 курсе из-за матана?"}'
```

## 📊 Структура базы данных (14 полей)

- **Identity:** id, full_name, telegram_username, photo_path
- **Attributes:** course, department, is_mentor
- **Location:** location_name
- **Content:** bio_raw
- **AI Metrics:** tags_array, semantic_embedding (vector 1536)
- **Social/System:** trust_score, last_active, search_vector (FTS)

## 🤖 AI-Онбординг менторов

Система автоматически проводит интервью с новым ментором через чат-бота на базе Gemini.

### Как это работает

1. **Создание сессии:** `POST /api/v1/onboarding/start` → возвращает `session_id`
2. **Диалог с агентом:** `POST /api/v1/onboarding/chat` — дружелюбный AI-рекрутер задаёт вопросы
3. **Извлечение данных:** В фоне работает Extractor, который парсит чат в JSON-профиль
4. **Подтверждение:** Когда агент готов, он отправляет `[READY_TO_CONFIRM]` → `POST /api/v1/onboarding/confirm`

### Пример диалога

```bash
# 1. Создаём сессию
curl -X POST http://localhost:8000/api/v1/onboarding/start

# 2. Отправляем сообщения в чат
curl -X POST http://localhost:8000/api/v1/onboarding/chat \
     -H "Content-Type: application/json" \
     -d '{"session_id": "YOUR_SESSION_ID", "text": "Привет, меня зовут Иван, я на 3 курсе Физфака"}'

# 3. После [READY_TO_CONFIRM] подтверждаем профиль
curl -X POST "http://localhost:8000/api/v1/onboarding/confirm?session_id=YOUR_SESSION_ID"
```

### Что извлекает AI

| Поле | Пример | Авто-теги |
|------|--------|-----------|
| full_name | Иван Петров | — |
| course | 3 | — |
| department | Физфак, квантовая физика | — |
| location_name | ГЗ | ГЗ |
| telegram_username | @ivan_phys | — |
| bio_raw | "Помогу с матаном и квантами" | — |
| tags_array | — | матан, Савченко, кванты, Python |

**Бонус:** Новые менторы получают `trust_score = 5.0` за прохождение онбординга.

---
*Разработано в рамках Хакатона 2026.*
