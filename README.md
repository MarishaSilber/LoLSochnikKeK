# LoLSochnikKeK

Приложение для управления цитатами и пользователями.

## Структура проекта

```
LoLSochnikKeK/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # входная точка (FastAPI)
│   │   ├── models.py        # SQLAlchemy модели
│   │   ├── schemas.py       # Pydantic схемы
│   │   ├── database.py      # настройка БД, сессия
│   │   ├── search.py        # логика умного поиска
│   │   └── routers/         # эндпоинты
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

## Быстрый старт

### Запуск через Docker Compose

```bash
docker-compose up --build
```

После запуска:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Локальная разработка

#### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend
npm install
npm start
```

## API Endpoints

- `GET /users/` - список пользователей
- `POST /users/` - создание пользователя
- `GET /users/{id}` - получение пользователя
- `GET /quotes/` - список цитат
- `POST /quotes/` - создание цитаты
- `POST /search/` - умный поиск цитат
- `GET /health` - проверка статуса

## Технологии

- **Backend**: FastAPI, SQLAlchemy, PostgreSQL
- **Frontend**: React, React Router
- **Deployment**: Docker, Nginx
