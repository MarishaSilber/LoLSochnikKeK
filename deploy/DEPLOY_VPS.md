# Деплой VuzHub на VPS

Инструкция рассчитана на VPS, где уже есть один общий reverse proxy на `80/443`, а сам проект должен жить внутри Docker.

## Что подготовлено в репозитории

- [docker-compose.prod.yml](C:\Users\JDubo\PycharmProjects\LoLSochnikKeK\docker-compose.prod.yml)
- [deploy/vps.env.example](C:\Users\JDubo\PycharmProjects\LoLSochnikKeK\deploy\vps.env.example)
- [deploy/nginx/vuzhub.external.conf.example](C:\Users\JDubo\PycharmProjects\LoLSochnikKeK\deploy\nginx\vuzhub.external.conf.example)
- [backend/.env.example](C:\Users\JDubo\PycharmProjects\LoLSochnikKeK\backend\.env.example)
- [deploy/update-vps.sh](C:\Users\JDubo\PycharmProjects\LoLSochnikKeK\deploy\update-vps.sh)
- [deploy/backup-db.sh](C:\Users\JDubo\PycharmProjects\LoLSochnikKeK\deploy\backup-db.sh)

## Целевая схема

`Интернет -> общий nginx reverse proxy -> vuzhub-frontend -> vuzhub-backend -> postgres`

У проекта не должно быть собственных публичных `80/443/8000/5432`.

## 1. Подготовить каталог проекта

```bash
mkdir -p /opt/vuzhub
cd /opt/vuzhub
git clone -b Evgeniy_back-end https://github.com/MarishaSilber/LoLSochnikKeK.git .
```

## 2. Подготовить env-файлы

```bash
cp deploy/vps.env.example deploy/vps.env
cp backend/.env.example backend/.env
```

Пример `deploy/vps.env`:

```env
REVERSE_PROXY_NETWORK=sochnik-network
VUZHUB_DOMAIN=vuzhub.space
VUZHUB_WWW_DOMAIN=www.vuzhub.space
```

Минимум для `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg2://vuzhub_user:vuzhub_pass123@db:5432/vuzhub_db
SECRET_KEY=сгенерируй_через_openssl_rand_hex_32
DEBUG=false

YANDEX_API_KEY=твой_yandex_api_key
YANDEX_FOLDER_ID=твой_yandex_folder_id
YANDEX_MODEL_URI=

SWAGGER_USERNAME=свой_логин
SWAGGER_PASSWORD=свой_пароль

BOOTSTRAP_ADMIN_EMAIL=admin@example.com
BOOTSTRAP_ADMIN_PASSWORD=сильный_пароль

TERMS_VERSION=2026-04-09
PRIVACY_POLICY_VERSION=2026-04-09
ACCESS_TOKEN_TTL_SECONDS=86400
```

Секрет:

```bash
openssl rand -hex 32
```

## 3. Поднять проект

```bash
cd /opt/vuzhub
docker compose --env-file deploy/vps.env -f docker-compose.prod.yml build
docker compose --env-file deploy/vps.env -f docker-compose.prod.yml up -d
```

Проверка:

```bash
docker compose --env-file deploy/vps.env -f docker-compose.prod.yml ps
docker logs vuzhub-backend --tail 100
docker logs vuzhub-frontend --tail 100
```

## 4. Подключить домен в внешнем nginx

Внешний proxy должен проксировать на:

```nginx
server vuzhub-frontend:80;
```

Используй шаблон:

- [deploy/nginx/vuzhub.external.conf.example](C:\Users\JDubo\PycharmProjects\LoLSochnikKeK\deploy\nginx\vuzhub.external.conf.example)

После правки:

```bash
docker exec sochnik-nginx-reverse-proxy nginx -t
docker exec sochnik-nginx-reverse-proxy nginx -s reload
```

## 5. Выпустить SSL

Если certbot на хосте:

```bash
certbot certonly --webroot -w /var/www/certbot -d vuzhub.space -d www.vuzhub.space
```

После выпуска сертификата перезагрузи внешний `nginx`.

## 6. Обновление проекта

После новых коммитов:

```bash
cd /opt/vuzhub
./deploy/update-vps.sh
```

Для конкретной ветки:

```bash
cd /opt/vuzhub
./deploy/update-vps.sh Evgeniy_back-end
```

## 7. Бэкапы БД

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

Ежедневный бэкап по cron:

```bash
cd /opt/vuzhub
./deploy/setup-backup-cron.sh
```

## 8. Секреты

Отдельная инструкция:

- [deploy/SECRETS_ROTATION.md](C:\Users\JDubo\PycharmProjects\LoLSochnikKeK\deploy\SECRETS_ROTATION.md)

Важно:

- не хранить реальные ключи в git
- ротировать `SECRET_KEY`, `YANDEX_API_KEY`, swagger-логин/пароль и стартовый админский пароль
