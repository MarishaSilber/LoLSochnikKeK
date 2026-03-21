# LoLSochnikKeK

Приложение для умного поиска сокурсников/менторов с использованием AI.

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

## Запуск

`ash
docker-compose up --build
`

- Frontend: http://localhost
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
