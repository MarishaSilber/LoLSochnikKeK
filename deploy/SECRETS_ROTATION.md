# Ротация секретов

Этот проект использует чувствительные данные в `backend/.env` и `deploy/vps.env`.

## Что ротировать

- `SECRET_KEY`
- `YANDEX_API_KEY`
- `SWAGGER_USERNAME`
- `SWAGGER_PASSWORD`
- `BOOTSTRAP_ADMIN_PASSWORD`

## Когда ротировать

- перед первым публичным запуском
- после компрометации сервера или репозитория
- если секрет случайно попал в git, лог или скриншот
- планово раз в 60-90 дней для внешних API-ключей и паролей администратора

## Порядок ротации на VPS

1. Сделай бэкап БД:

```bash
cd /opt/vuzhub
./deploy/backup-db.sh
```

2. Обнови значения в `backend/.env`.

3. Для `SECRET_KEY` используй длинную случайную строку:

```bash
openssl rand -hex 32
```

4. Для `YANDEX_API_KEY` сначала выпусти новый ключ в Yandex Cloud, потом впиши его в `backend/.env`, а старый отзови.

5. Перезапусти проект:

```bash
cd /opt/vuzhub
docker compose --env-file deploy/vps.env -f docker-compose.prod.yml up -d backend frontend
```

6. Проверь:

```bash
curl -s https://vuzhub.space/health
curl -s https://vuzhub.space/api/v1/users/
```

## Важно

- не коммить `backend/.env`
- не храни реальные ключи в README, issue, wiki, screenshots
- после ротации админского пароля проверь логин вручную
