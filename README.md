# VuzHub

Студенческая платформа для МИФИ: профили, поиск, чаты, AI-онбординг, админка и support-чат.

## Локальный запуск

Из корня проекта:

```bash
docker compose up -d
```

После запуска:

- frontend: `http://localhost:3000`
- backend health: `http://localhost:8000/health`
- swagger: `http://localhost:3000/docs`

## Production на VPS

Для выкладки за уже существующим reverse proxy используй:

- [`docker-compose.prod.yml`](/C:/Users/JDubo/PycharmProjects/LoLSochnikKeK/docker-compose.prod.yml)
- [`deploy/DEPLOY_VPS.md`](/C:/Users/JDubo/PycharmProjects/LoLSochnikKeK/deploy/DEPLOY_VPS.md)
- [`backend/.env.example`](/C:/Users/JDubo/PycharmProjects/LoLSochnikKeK/backend/.env.example)
- [`deploy/nginx/vuzhub.external.conf.example`](/C:/Users/JDubo/PycharmProjects/LoLSochnikKeK/deploy/nginx/vuzhub.external.conf.example)

## Основные возможности

- регистрация и логин
- AI-онбординг профиля
- поиск студентов
- прямые чаты и support-чат
- архив чатов для админов
- скрытие и удаление аккаунтов через админку
- аудит-лог действий админов

## Технологии

- React + Vite
- FastAPI + SQLAlchemy
- PostgreSQL + pgvector
- Alembic
- Docker Compose
- Nginx
