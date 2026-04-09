# VuzHub

VuzHub — студенческая платформа для МИФИ: профили, поиск, чаты, AI-онбординг, админка и support-чат.

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

Для production используй:

- [docker-compose.prod.yml](C:\Users\JDubo\PycharmProjects\LoLSochnikKeK\docker-compose.prod.yml)
- [deploy/DEPLOY_VPS.md](C:\Users\JDubo\PycharmProjects\LoLSochnikKeK\deploy\DEPLOY_VPS.md)
- [deploy/update-vps.sh](C:\Users\JDubo\PycharmProjects\LoLSochnikKeK\deploy\update-vps.sh)
- [deploy/backup-db.sh](C:\Users\JDubo\PycharmProjects\LoLSochnikKeK\deploy\backup-db.sh)
- [deploy/setup-backup-cron.sh](C:\Users\JDubo\PycharmProjects\LoLSochnikKeK\deploy\setup-backup-cron.sh)
- [deploy/SECRETS_ROTATION.md](C:\Users\JDubo\PycharmProjects\LoLSochnikKeK\deploy\SECRETS_ROTATION.md)
- [backend/.env.example](C:\Users\JDubo\PycharmProjects\LoLSochnikKeK\backend\.env.example)

## Обновление на VPS

```bash
cd /opt/vuzhub
./deploy/update-vps.sh
```

Если нужна конкретная ветка:

```bash
cd /opt/vuzhub
./deploy/update-vps.sh Evgeniy_back-end
```

## Бэкап базы

Разовый бэкап:

```bash
cd /opt/vuzhub
./deploy/backup-db.sh
```

Восстановление:

```bash
cd /opt/vuzhub
./deploy/restore-db.sh /opt/vuzhub/backups/имя-файла.dump
```

Установка ежедневного бэкапа в `03:00`:

```bash
cd /opt/vuzhub
./deploy/setup-backup-cron.sh
```

Другой cron-график:

```bash
cd /opt/vuzhub
./deploy/setup-backup-cron.sh "0 */6 * * *"
```

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
