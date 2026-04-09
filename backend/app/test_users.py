from typing import List

from sqlalchemy.orm import Session

from . import models
from .search import update_search_vector


TEST_USERS = [
    {
        "full_name": "Алексей Иванов",
        "telegram_username": "@alex_support",
        "course": 2,
        "department": "Общая физика",
        "location_name": "НЛК",
        "bio_raw": "Знаю матан и диффуры, помогу не потеряться после первой сессии.",
        "tags_array": ["матан", "диффуры", "сессия", "конспекты"],
        "trust_score": 4.9,
    },
    {
        "full_name": "Мария Сидорова",
        "telegram_username": "@masha_data",
        "course": 4,
        "department": "Математика",
        "location_name": "Технопарк",
        "bio_raw": "Помогаю с Python, стажировками и резюме для аналитики и DS.",
        "tags_array": ["Python", "стажировки", "DS", "резюме"],
        "trust_score": 5.0,
    },
    {
        "full_name": "Игорь Петров",
        "telegram_username": "@igor_quant",
        "course": 5,
        "department": "Квантовая электроника",
        "location_name": "К-корпус",
        "bio_raw": "Объясняю кванты, фотонику и как пережить сложные спецкурсы.",
        "tags_array": ["кванты", "фотоника", "спецкурсы", "лабы"],
        "trust_score": 4.7,
    },
    {
        "full_name": "Елена Кузнецова",
        "telegram_username": "@lena_help",
        "course": 3,
        "department": "Оптика",
        "location_name": "Общага",
        "bio_raw": "Подскажу по бытовым вопросам, общаге и базовым курсам по физике.",
        "tags_array": ["адаптация", "общага", "оптика", "быт"],
        "trust_score": 4.8,
    },
    {
        "full_name": "Дмитрий Смирнов",
        "telegram_username": "@dima_docs",
        "course": 6,
        "department": "Физика частиц",
        "location_name": "Студофис",
        "bio_raw": "Помогаю с документами, академом и соцстипендией.",
        "tags_array": ["документы", "академ", "соцстипендия", "комиссия"],
        "trust_score": 4.6,
    },
    {
        "full_name": "Анна Волкова",
        "telegram_username": "@anya_firstyear",
        "course": 1,
        "department": "Астрономия",
        "location_name": "Столовая НЛК",
        "bio_raw": "Покажу, где недорогая еда и как быстро влиться в жизнь кампуса.",
        "tags_array": ["адаптация", "еда", "кампус", "первокурсники"],
        "trust_score": 4.5,
    },
    {
        "full_name": "Сергей Морозов",
        "telegram_username": "@sergey_cpp",
        "course": 2,
        "department": "Молекулярная физика",
        "location_name": "Э-корпус",
        "bio_raw": "Проверю код на C++ и помогу с проектной практикой.",
        "tags_array": ["C++", "код", "проектная практика", "лабы"],
        "trust_score": 4.7,
    },
    {
        "full_name": "Виктория Белова",
        "telegram_username": "@vika_talk",
        "course": 3,
        "department": "Физика моря",
        "location_name": "Буфет",
        "bio_raw": "Можно прийти поговорить про выгорание, нагрузку и поиск поддержки.",
        "tags_array": ["поддержка", "выгорание", "разговор", "психолог"],
        "trust_score": 4.9,
    },
    {
        "full_name": "Кирилл Романов",
        "telegram_username": "@kirill_case",
        "course": 5,
        "department": "Теорфизика",
        "location_name": "А-корпус",
        "bio_raw": "Помогу со стажировками, кейс-интервью и карьерными треками после МИФИ.",
        "tags_array": ["карьера", "стажировки", "кейсы", "консалтинг"],
        "trust_score": 4.3,
    },
    {
        "full_name": "Евгения Смирнова",
        "telegram_username": "@zhenya_transfer",
        "course": 2,
        "department": "Общая физика",
        "location_name": "Д-корпус",
        "bio_raw": "Подскажу по переводу, бюджету и учебной комиссии.",
        "tags_array": ["перевод", "бюджет", "комиссия", "документы"],
        "trust_score": 4.7,
    },
    {
        "full_name": "Максим Степанов",
        "telegram_username": "@max_hpc",
        "course": 4,
        "department": "Компьютерные методы",
        "location_name": "45/44",
        "bio_raw": "Разбираюсь в HPC, параллельных вычислениях и научном коде.",
        "tags_array": ["HPC", "параллельные вычисления", "научный код", "C++"],
        "trust_score": 4.8,
    },
    {
        "full_name": "Юлия Орлова",
        "telegram_username": "@yulia_choice",
        "course": 3,
        "department": "Фотоника",
        "location_name": "33/И-корпус",
        "bio_raw": "Расскажу про смену траектории, перепоступление и выбор направления.",
        "tags_array": ["адаптация", "перепоступление", "выбор направления", "фотоника"],
        "trust_score": 4.5,
    },
]


def seed_test_users(db: Session) -> int:
    db.query(models.Review).delete()
    db.query(models.AdminAuditLog).delete()
    db.query(models.User).filter(models.User.is_admin == False).delete()
    db.commit()

    created_users: List[models.User] = []
    for raw_user in TEST_USERS:
        user = models.User(**raw_user, is_mentor=True, is_profile_complete=True)
        db.add(user)
        created_users.append(user)

    db.commit()

    for user in created_users:
        db.refresh(user)
        update_search_vector(db, user)

    return len(created_users)
