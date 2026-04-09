# Деплой VuzHub на VPS с уже существующим reverse proxy

Этот проект рассчитан на схему, где наружу открыты только `80/443`, а все приложения живут внутри Docker и получают домены через общий `nginx`-reverse-proxy.

## Что уже подготовлено в репозитории

- [`/docker-compose.prod.yml`](/C:/Users/JDubo/PycharmProjects/LoLSochnikKeK/docker-compose.prod.yml) — production compose без публикации портов наружу.
- [`/deploy/vps.env.example`](/C:/Users/JDubo/PycharmProjects/LoLSochnikKeK/deploy/vps.env.example) — переменные для VPS.
- [`/deploy/nginx/vuzhub.external.conf.example`](/C:/Users/JDubo/PycharmProjects/LoLSochnikKeK/deploy/nginx/vuzhub.external.conf.example) — шаблон конфига для общего `nginx` на VPS.
- [`/backend/.env.example`](/C:/Users/JDubo/PycharmProjects/LoLSochnikKeK/backend/.env.example) — шаблон backend-секретов.

## Целевая схема

`Интернет -> общий nginx reverse proxy -> vuzhub-frontend -> vuzhub-backend -> postgres`

У проекта не должно быть своих публичных `80/443/8000/5432`.

## 1. Узнать сеть общего reverse proxy

На VPS выполни:

```bash
docker inspect sochnik-nginx-reverse-proxy --format '{{range $k, $_ := .NetworkSettings.Networks}}{{println $k}}{{end}}'
```

Скопируй имя сети. Оно понадобится как `REVERSE_PROXY_NETWORK`.

## 2. Загрузить проект на VPS

Пример:

```bash
mkdir -p /opt/vuzhub
cd /opt/vuzhub
```

Дальше загрузить проект можно любым удобным способом:

- `git clone`
- `scp` / `rsync`
- загрузка архива

Если через git:

```bash
git clone <URL_репозитория> .
```

## 3. Подготовить env-файлы

Создай файл `/opt/vuzhub/deploy/vps.env` на основе примера:

```bash
cp deploy/vps.env.example deploy/vps.env
```

Впиши туда:

```env
REVERSE_PROXY_NETWORK=имя_сети_из_шага_1
VUZHUB_DOMAIN=твой-домен
VUZHUB_WWW_DOMAIN=www.твой-домен
```

Создай backend env:

```bash
cp backend/.env.example backend/.env
```

Заполни в `backend/.env` минимум:

```env
DATABASE_URL=postgresql+psycopg2://vuzhub_user:vuzhub_pass123@db:5432/vuzhub_db
SECRET_KEY=сгенерируй_длинную_случайную_строку_минимум_32_символа
DEBUG=false

YANDEX_API_KEY=твой_yandex_api_key
YANDEX_FOLDER_ID=твой_yandex_folder_id
YANDEX_MODEL_URI=

SWAGGER_USERNAME=свой_логин_для_swagger
SWAGGER_PASSWORD=свой_длинный_пароль_для_swagger

BOOTSTRAP_ADMIN_EMAIL=admin@example.com
BOOTSTRAP_ADMIN_PASSWORD=задай_сильный_пароль_админа

TERMS_VERSION=2026-04-09
PRIVACY_POLICY_VERSION=2026-04-09
ACCESS_TOKEN_TTL_SECONDS=86400
```

Секрет можно быстро сгенерировать так:

```bash
openssl rand -hex 32
```

## 4. Поднять контейнеры проекта

Из корня проекта:

```bash
docker compose --env-file deploy/vps.env -f docker-compose.prod.yml build
docker compose --env-file deploy/vps.env -f docker-compose.prod.yml up -d
```

Проверка:

```bash
docker compose --env-file deploy/vps.env -f docker-compose.prod.yml ps
docker logs vuzhub-backend --tail 100
docker logs vuzhub-frontend --tail 100
```

## 5. Подключить домен в общем nginx reverse proxy

Открой конфиг общего reverse proxy на VPS и добавь новый `server` по образцу из:

[`/deploy/nginx/vuzhub.external.conf.example`](/C:/Users/JDubo/PycharmProjects/LoLSochnikKeK/deploy/nginx/vuzhub.external.conf.example)

Что заменить:

- `replace-with-your-domain` -> твой домен
- `www.replace-with-your-domain` -> `www`-домен, если нужен

Ключевой upstream должен смотреть сюда:

```nginx
server vuzhub-frontend:80;
```

Важно:

- контейнер `sochnik-nginx-reverse-proxy` должен быть подключён к той же docker-сети, что и `vuzhub-frontend`
- именно поэтому в `docker-compose.prod.yml` используется `REVERSE_PROXY_NETWORK`

После правки проверь конфиг и перезагрузи `nginx`:

```bash
docker exec sochnik-nginx-reverse-proxy nginx -t
docker exec sochnik-nginx-reverse-proxy nginx -s reload
```

## 6. Выпустить SSL-сертификат

Если в текущем reverse proxy уже настроен certbot, добавь новый домен тем же способом, что используется для первого сайта.

Самая частая схема:

```bash
docker exec -it sochnik-nginx-reverse-proxy sh
```

А дальше внутри контейнера или рядом с ним:

```bash
certbot certonly --webroot -w /var/www/certbot -d твой-домен -d www.твой-домен
```

Если certbot у тебя стоит отдельным контейнером или на хосте, используй тот же существующий способ. Важно не ломать уже работающий первый сайт.

После выпуска сертификата ещё раз перезагрузи `nginx`.

## 7. Проверка после деплоя

Проверь:

```bash
curl -I http://твой-домен
curl -I https://твой-домен
curl -I https://твой-домен/api/v1/users/
```

И в браузере:

- главная страница
- регистрация
- логин
- чат
- админка
- swagger по `https://твой-домен/docs`

## 8. Полезные команды

Перезапуск:

```bash
cd /opt/vuzhub
docker compose --env-file deploy/vps.env -f docker-compose.prod.yml up -d
```

Пересборка после обновления кода:

```bash
cd /opt/vuzhub
git pull
docker compose --env-file deploy/vps.env -f docker-compose.prod.yml build
docker compose --env-file deploy/vps.env -f docker-compose.prod.yml up -d
```

Логи:

```bash
docker logs vuzhub-backend --tail 100
docker logs vuzhub-frontend --tail 100
```

Бэкап БД:

```bash
pwsh ./deploy/backup-db.ps1
```

## 9. Что важно не делать

- не публикуй `8000:8000`, `3000:80`, `5432:5432` наружу на VPS
- не запускай второй отдельный публичный `nginx` на `80/443`
- не храни реальные ключи в git

## 10. Если что-то не открылось

Сначала проверь:

```bash
docker compose --env-file deploy/vps.env -f docker-compose.prod.yml ps
docker inspect vuzhub-frontend --format '{{json .NetworkSettings.Networks}}'
docker inspect sochnik-nginx-reverse-proxy --format '{{json .NetworkSettings.Networks}}'
docker exec sochnik-nginx-reverse-proxy nginx -t
```

Если хочешь, я могу следующим сообщением помочь тебе уже по месту:

- по выводу `docker inspect ...Networks`
- по текущему конфигу общего `nginx`
- по выпуску SSL именно в той схеме, которая уже живёт на твоём VPS
