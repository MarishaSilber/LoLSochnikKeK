# VuzHub / LoLSochnikKeK

Студенческая платформа взаимопомощи с AI-онбордингом — приложение для умного поиска сокурсников/менторов с использованием AI.

## Запуск проекта

### Docker Compose (рекомендуется)

```bash
docker-compose up -d
```

После запуска сервисы будут доступны по адресам:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs (Swagger):** http://localhost:8000/docs

### Ручной запуск

#### Frontend

```bash
npm install
npm run dev
```

Frontend будет доступен по адресу: **http://localhost:3000**

#### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend будет доступен по адресу: **http://localhost:8000**

## Структура проекта

```
LoLSochnikKeK/
├── backend/
│   ├── app/
│   │   ├── routers/        # API endpoints
│   │   ├── services/       # Бизнес-логика (LLM, onboarding)
│   │   ├── main.py         # Точка входа FastAPI
│   │   ├── models.py       # SQLAlchemy модели
│   │   ├── schemas.py      # Pydantic схемы
│   │   └── database.py     # Подключение к БД
│   ├── Dockerfile
│   └── requirements.txt
├── src/
│   ├── app/
│   │   ├── api/            # API клиент для бэкенда
│   │   ├── components/     # UI компоненты
│   │   ├── pages/          # Страницы приложения
│   │   ├── data/           # Моковые данные
│   │   ├── App.jsx         # Главный компонент
│   │   └── routes.jsx      # Роутинг
│   ├── styles/
│   │   └── index.css       # Основные стили
│   └── main.jsx            # Точка входа
├── docker-compose.yml
├── vite.config.js
├── package.json
└── README.md
```

## Схема БД (Users)

| Группа | Поле | Тип | Описание | Вес |
|--------|------|-----|----------|-----|
| Identity | id | UUID | Уникальный ключ | — |
| | full_name | String | ФИО | — |
| | telegram_username | String | Telegram контакт | — |
| | photo_path | String | Путь к фото | — |
| Attributes | course | SmallInt | Курс (1-6) | 2.0 |
| | department | String | Кафедра | 0.5 |
| | is_mentor | Boolean | Статус ментора | фильтр |
| Location | location_name | String | Локация | 0.8 |
| Content | bio_raw | Text | Описание | — |
| AI Metrics | tags_array | ARRAY | Теги | 1.5 |
| | semantic_embedding | Vector(1536) | Вектор | 1.0 |
| Social | trust_score | Float | Рейтинг | 0.3 |
| System | last_active | DateTime | Последний вход | 0.4 |
| Search | search_vector | TSVECTOR | FTS индекс | — |

## API Интеграция

### Основные endpoints:

- `GET /api/v1/users/` — Получить всех пользователей
- `POST /api/v1/users/` — Создать пользователя
- `GET /api/v1/users/{id}` — Получить пользователя по ID
- `PATCH /api/v1/users/{id}` — Обновить пользователя
- `DELETE /api/v1/users/{id}` — Удалить пользователя
- `POST /api/v1/process-query` — Поиск через LLM
- `POST /api/v1/onboarding/start` — Начать онбординг
- `POST /api/v1/onboarding/chat` — Чат с AI-агентом
- `POST /api/v1/onboarding/confirm` — Подтвердить профиль

### Онбординг с AI

1. Нажмите "Регистрация с AI-ассистентом"
2. AI-агент задаст вопросы для заполнения профиля
3. После сбора данных нажмите "Подтвердить профиль"

## Страницы

- **Главная** (`/`) — Поиск студентов, фильтры, карточки
- **Регистрация** (`/register`) — Форма регистрации + AI-онбординг
- **Профиль** (`/profile/:id`) — Страница профиля студента
- **Чат** (`/chat/:userId`) — Сообщения
- **Редактирование** (`/edit-profile/:id`) — Редактирование профиля

## Технологии

### Frontend
- React 18
- React Router DOM
- Vite
- Fetch API

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL + pgvector
- OpenRouter API (Gemini AI для онбординга)

## Интеграция с бэкендом

Проект использует API из веток:
- `Lev_back-end` — основная структура API
- `Maria_back-end` — расширенные endpoints

Для корректной работы необходимо запустить бэкенд на порту 8000.
Если бэкенд недоступен, frontend использует моковые данные.

## Переменные окружения

Создайте файл `backend/.env` с вашим API ключом:

```env
OPENROUTER_API_KEY=your_api_key_here
```

Получить ключ можно на https://openrouter.ai/
