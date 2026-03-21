# VuzHub

Студенческая платформа взаимопомощи с AI-онбордингом

## Запуск проекта

### Frontend

```bash
npm install
npm run dev
```

Frontend будет доступен по адресу: **http://localhost:3000**

### Backend (из ветки Lev_back-end/Maria_back-end)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend будет доступен по адресу: **http://localhost:8000**

### Docker Compose (рекомендуется)

```bash
docker-compose up -d
```

## Структура проекта

```
VuzHub/
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
├── .env.example            # Пример переменных окружения
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## API Интеграция

### Основные endpoints:

- `GET /api/v1/users/` - Получить всех пользователей
- `POST /api/v1/users/` - Создать пользователя
- `GET /api/v1/users/{id}` - Получить пользователя по ID
- `PATCH /api/v1/users/{id}` - Обновить пользователя
- `DELETE /api/v1/users/{id}` - Удалить пользователя
- `POST /api/v1/search/` - Поиск пользователей
- `POST /api/v1/onboarding/start` - Начать онбординг
- `POST /api/v1/onboarding/chat` - Чат с AI-агентом
- `POST /api/v1/onboarding/confirm` - Подтвердить профиль

### Онбординг с AI

1. Нажмите "Регистрация с AI-ассистентом"
2. AI-агент задаст вопросы для заполнения профиля
3. После сбора данных нажмите "Подтвердить профиль"

## Страницы

- **Главная** (`/`) - Поиск студентов, фильтры, карточки
- **Регистрация** (`/register`) - Форма регистрации + AI-онбординг
- **Профиль** (`/profile`) - Страница профиля студента
- **Поиск** (`/search`) - Расширенный поиск
- **Чат** (`/chat`) - Сообщения
- **Редактирование** (`/edit-profile`) - Редактирование профиля

## Технологии

### Frontend
- React 18
- React Router DOM
- Vite
- Fetch API

### Backend (из ветки Lev_back-end)
- FastAPI
- SQLAlchemy
- PostgreSQL + pgvector
- Gemini AI (для онбординга)

## Интеграция с бэкендом

Проект использует API из веток:
- `Lev_back-end` - основная структура API
- `Maria_back-end` - расширенные endpoints

Для корректной работы необходимо запустить бэкенд на порту 8000.
Если бэкенд недоступен, frontend использует моковые данные.
