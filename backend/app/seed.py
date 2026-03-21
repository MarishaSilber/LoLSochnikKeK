import datetime
from sqlalchemy.orm import Session
from .database import SessionLocal, engine, Base
from .models import User
import json

# Создаем таблицы, если их нет
Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    
    # Проверяем, есть ли уже данные (очистим для чистого сида до 20)
    db.query(User).delete()
    db.commit()

    test_students = [
        # --- Существующие 8 ---
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
        },
        # --- Новые 12 ---
        {
            "full_name": "Виктория Белова",
            "telegram_username": "@viktoria_support",
            "course": 3,
            "department": "Кафедра физики моря",
            "location_name": "Коворкинг",
            "bio_raw": "Проходила через выгорание на 2 курсе. Помогу морально, если чувствуешь, что физика не твое.",
            "tags_array": ["выгорание", "психология", "поддержка", "эмоции"],
            "trust_score": 4.9,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(hours=1)
        },
        {
            "full_name": "Кирилл Романов",
            "telegram_username": "@kirill_consult",
            "course": 5,
            "department": "Кафедра теоретической физики",
            "location_name": "ГЗ",
            "bio_raw": "Готовлюсь к отбору в консалтинг (McKinsey/BCG style). Помогу с кейсами после физфака.",
            "tags_array": ["консалтинг", "работа", "кейс", "бизнес"],
            "trust_score": 4.3,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(hours=8)
        },
        {
            "full_name": "Евгения Морозова",
            "telegram_username": "@jenia_budget",
            "course": 2,
            "department": "Кафедра оптики",
            "location_name": "Деканат",
            "bio_raw": "Успешно перевелась с платного на бюджет на втором курсе. Расскажу про все подводные камни.",
            "tags_array": ["бюджет", "перевод", "админка", "деканат"],
            "trust_score": 4.7,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(days=1)
        },
        {
            "full_name": "Максим Степанов",
            "telegram_username": "@max_hpc",
            "course": 4,
            "department": "Кафедра компьютерных методов физики",
            "location_name": "ОИЯИ (Дубна)",
            "bio_raw": "Занимаюсь высокопроизводительными вычислениями в Дубне. Помогу с параллельным программированием.",
            "tags_array": ["HPC", "ОИЯИ", "параллельное_программирование", "C++"],
            "trust_score": 4.8,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(hours=3)
        },
        {
            "full_name": "Юлия Орлова",
            "telegram_username": "@julia_vmk",
            "course": 3,
            "department": "Кафедра фотоники",
            "location_name": "ВМК",
            "bio_raw": "Перепоступала на физфак после года на ВМК. Могу сравнить и помочь с выбором пути.",
            "tags_array": ["ВМК", "перепоступление", "учеба", "выбор"],
            "trust_score": 4.5,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(days=3)
        },
        {
            "full_name": "Артем Соколов",
            "telegram_username": "@artem_tutor",
            "course": 2,
            "department": "Кафедра общей физики",
            "location_name": "Библиотека ГЗ",
            "bio_raw": "Репетиторствую по физике и математике 3 года. Подскажу проверенные конторы для подработки.",
            "tags_array": ["репетиторство", "подработка", "преподавание", "деньги"],
            "trust_score": 4.6,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(minutes=10)
        },
        {
            "full_name": "Софья Лисина",
            "telegram_username": "@sonya_grant",
            "course": 6,
            "department": "Кафедра квантовой электроники",
            "location_name": "Лаборатория квантовых технологий",
            "bio_raw": "Помогу с оформлением грантов РНФ для молодых ученых. Знаю структуру заявок.",
            "tags_array": ["грант", "РНФ", "наука", "документы"],
            "trust_score": 4.9,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(hours=12)
        },
        {
            "full_name": "Роман Котов",
            "telegram_username": "@roman_stip",
            "course": 3,
            "department": "Кафедра космических лучей",
            "location_name": "НИИЯФ",
            "bio_raw": "Специалист по социальной стипендии. Расскажу, какие справки нужны и куда их нести.",
            "tags_array": ["стипендия", "соц_помощь", "админка", "выплаты"],
            "trust_score": 4.4,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(days=2)
        },
        {
            "full_name": "Павел Зайцев",
            "telegram_username": "@pavel_startup",
            "course": 4,
            "department": "Кафедра наноэлектроники",
            "location_name": "Коворкинг физфака",
            "bio_raw": "Делаю хардверный стартап на базе факультета. Ищу единомышленников-инженеров.",
            "tags_array": ["стартап", "бизнес", "инженерия", "проекты"],
            "trust_score": 4.7,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(hours=4)
        },
        {
            "full_name": "Татьяна Сорокина",
            "telegram_username": "@tanya_psych",
            "course": 5,
            "department": "Кафедра полимеров",
            "location_name": "ГЗ",
            "bio_raw": "Знаю все про психологическую помощь в МГУ. Если совсем плохо — пиши, подскажу контакты.",
            "tags_array": ["психология", "помощь", "поддержка", "здоровье"],
            "trust_score": 5.0,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(minutes=5)
        },
        {
            "full_name": "Илья Громов",
            "telegram_username": "@ilya_gym",
            "course": 3,
            "department": "Кафедра физики полупроводников",
            "location_name": "Качалка ГЗ",
            "bio_raw": "Знаю, как попасть в качалку в подвале ГЗ. Проведу, если нужно.",
            "tags_array": ["спорт", "качалка", "ГЗ", "досуг"],
            "trust_score": 4.3,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(hours=6)
        },
        {
            "full_name": "Олеся Павлова",
            "telegram_username": "@olesya_flat",
            "course": 2,
            "department": "Кафедра физики атмосферы",
            "location_name": "м. Университет",
            "bio_raw": "Ищу соседей для съема квартиры у метро Университет. Опытная в поиске жилья.",
            "tags_array": ["квартира", "жилье", "соседи", "университет"],
            "trust_score": 4.6,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(days=1)
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
