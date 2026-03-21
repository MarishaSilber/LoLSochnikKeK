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

---
*Разработано в рамках Хакатона 2026.*
