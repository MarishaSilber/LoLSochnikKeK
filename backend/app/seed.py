import datetime
from sqlalchemy.orm import Session
from .database import SessionLocal, engine, Base
from .models import User
import json

# Создаем таблицы, если их нет
Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    
    # Проверяем, есть ли уже данные
    if db.query(User).count() > 0:
        print("Database already has data. Skipping seed.")
        db.close()
        return

    test_students = [
        {
            "full_name": "Алексей Иванов",
            "telegram_username": "@ivanov_phys",
            "course": 2,
            "department": "Кафедра общей физики",
            "location_name": "Читалка на 4 этаже",
            "bio_raw": "Знаю матан Савченко назубок, помогу не вылететь на 2 курсе. Шарю в диффурах.",
            "tags_array": ["матан", "Савченко", "диффуры", "экзамен"],
            "trust_score": 4.8,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(hours=2)
        },
        {
            "full_name": "Мария Сидорова",
            "telegram_username": "@masha_ml",
            "course": 4,
            "department": "Кафедра математики",
            "location_name": "Коворкинг 5-18",
            "bio_raw": "Стажировалась в Яндексе на ML-направлении. Помогу собрать резюме и пройти собес.",
            "tags_array": ["ML", "Python", "Яндекс", "собеседование", "Data Science"],
            "trust_score": 5.0,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(minutes=30)
        },
        {
            "full_name": "Игорь Петров",
            "telegram_username": "@igor_quantum",
            "course": 5,
            "department": "Кафедра квантовой электроники",
            "location_name": "Лаборатория фотоники",
            "bio_raw": "Занимаюсь квантовыми вычислениями. Могу объяснить уравнение Шредингера на пальцах.",
            "tags_array": ["кванты", "фотоника", "Шредингер", "физика"],
            "trust_score": 4.5,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(days=1)
        },
        {
            "full_name": "Елена Кузнецова",
            "telegram_username": "@elena_gz",
            "course": 3,
            "department": "Кафедра оптики",
            "location_name": "ГЗ, сектор Б",
            "bio_raw": "Живу в Б-секторе ГЗ. Есть зарядки для всех типов ноутов, выручу если что.",
            "tags_array": ["ГЗ", "зарядка", "быт", "оптика", "лабы"],
            "trust_score": 4.9,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow()
        },
        {
            "full_name": "Дмитрий Смирнов",
            "telegram_username": "@dima_admin",
            "course": 6,
            "department": "Кафедра физики элементарных частиц",
            "location_name": "НИИЯФ",
            "bio_raw": "Брал академ по здоровью и успешно вернулся. Знаю всё про профилакторий и справки.",
            "tags_array": ["академ", "админка", "профилакторий", "здоровье", "выживание"],
            "trust_score": 4.2,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(hours=5)
        },
        {
            "full_name": "Анна Волкова",
            "telegram_username": "@anya_food",
            "course": 1,
            "department": "Кафедра астрономии",
            "location_name": "Столовая №1",
            "bio_raw": "Знаю, где на факультете самая дешевая и съедобная еда. Пошли обедать вместе.",
            "tags_array": ["еда", "столовая", "быт", "дешево"],
            "trust_score": 4.7,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(minutes=15)
        },
        {
            "full_name": "Сергей Морозов",
            "telegram_username": "@serg_cpp",
            "course": 2,
            "department": "Кафедра молекулярной физики",
            "location_name": "Читалка на 4 этаже",
            "bio_raw": "Пишу на C++ для прака. Могу зачекать твой код или помочь с багами.",
            "tags_array": ["C++", "программирование", "прак", "код"],
            "trust_score": 4.6,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(hours=1)
        },
        {
            "full_name": "Николай Федоров",
            "telegram_username": "@kolya_frisbee",
            "course": 4,
            "department": "Кафедра физики Земли",
            "location_name": "Стадион МГУ",
            "bio_raw": "Играю в ультимат фрисби. Ищу компанию побегать вечером по территории.",
            "tags_array": ["спорт", "фрисби", "бег", "стадион"],
            "trust_score": 4.4,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(days=2)
        }
    ]

    for student_data in test_students:
        user = User(**student_data)
        db.add(user)
    
    db.commit()
    print(f"Successfully added {len(test_students)} students to the database.")
    db.close()

if __name__ == "__main__":
    seed()
