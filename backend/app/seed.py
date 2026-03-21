import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from .database import SessionLocal, engine, Base
from .models import User

# Создаем таблицы и активируем расширение
Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    
    # Очистка старых данных
    db.query(User).delete()
    db.commit()

    test_students = [
        {
            "full_name": "Алексей Иванов",
            "telegram_username": "@ivanov_phys",
            "photo_path": "/avatars/1.jpg",
            "course": 2,
            "department": "Общая физика",
            "location_name": "Читалка 4 этаж",
            "bio_raw": "Знаю матан Савченко назубок, помогу не вылететь на 2 курсе. Шарю в диффурах и тензорах.",
            "tags_array": ["матан", "Савченко", "диффуры", "тензорный_анализ"],
            "trust_score": 4.9,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(hours=2)
        },
        {
            "full_name": "Мария Сидорова",
            "telegram_username": "@masha_ml",
            "photo_path": "/avatars/2.jpg",
            "course": 4,
            "department": "Математика",
            "location_name": "Коворкинг 5-18",
            "bio_raw": "Стажировалась в Яндексе. Помогу собрать резюме для Data Science и пройти собес на Python.",
            "tags_array": ["ML", "Python", "Яндекс", "Data_Science", "собеседование"],
            "trust_score": 5.0,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(minutes=45)
        },
        {
            "full_name": "Игорь Петров",
            "telegram_username": "@igor_quantum",
            "photo_path": "/avatars/3.jpg",
            "course": 5,
            "department": "Квантовая электроника",
            "location_name": "Лаба фотоники",
            "bio_raw": "Занимаюсь квантовыми технологиями. Объясню Шредингера и помогу с квантами.",
            "tags_array": ["кванты", "фотоника", "Шредингер", "наука"],
            "trust_score": 4.7,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(days=1)
        },
        {
            "full_name": "Елена Кузнецова",
            "telegram_username": "@elena_gz",
            "photo_path": "/avatars/4.jpg",
            "course": 3,
            "department": "Оптика",
            "location_name": "ГЗ сектор Б",
            "bio_raw": "Живу в Б-секторе ГЗ. Есть зарядки, чай и конспекты по термеху за 3 семестр.",
            "tags_array": ["ГЗ", "термех", "зарядка", "конспекты", "быт"],
            "trust_score": 4.8,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow()
        },
        {
            "full_name": "Дмитрий Смирнов",
            "telegram_username": "@dima_admin",
            "photo_path": "/avatars/5.jpg",
            "course": 6,
            "department": "Физика частиц",
            "location_name": "НИИЯФ",
            "bio_raw": "Брал академ по здоровью. Знаю всё про профилакторий МГУ и оформление соцстипендии.",
            "tags_array": ["академ", "соцстипендия", "профилакторий", "админка"],
            "trust_score": 4.6,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(hours=6)
        },
        {
            "full_name": "Анна Волкова",
            "telegram_username": "@anya_food",
            "photo_path": "/avatars/6.jpg",
            "course": 1,
            "department": "Астрономия",
            "location_name": "Столовая №1",
            "bio_raw": "Знаю самую дешевую столовую. Ищу компанию побегать вечером по территории МГУ.",
            "tags_array": ["еда", "столовая", "бег", "спорт", "дешево"],
            "trust_score": 4.5,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(minutes=20)
        },
        {
            "full_name": "Сергей Морозов",
            "telegram_username": "@serg_cpp",
            "photo_path": "/avatars/7.jpg",
            "course": 2,
            "department": "Молекулярная физика",
            "location_name": "Лаба фотоники",
            "bio_raw": "Пишу на C++ для прака. Могу зачекать твой код или помочь с лабой по оптике.",
            "tags_array": ["C++", "код", "прак", "оптика", "лабы"],
            "trust_score": 4.7,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(hours=3)
        },
        {
            "full_name": "Николай Федоров",
            "telegram_username": "@kolya_frisbee",
            "photo_path": "/avatars/8.jpg",
            "course": 4,
            "department": "Физика Земли",
            "location_name": "Стадион МГУ",
            "bio_raw": "Играю в ультимат фрисби. Расскажу как попасть в качалку в подвале ГЗ.",
            "tags_array": ["фрисби", "спорт", "качалка", "ГЗ", "стадион"],
            "trust_score": 4.4,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(days=2)
        },
        {
            "full_name": "Виктория Белова",
            "telegram_username": "@viktoria_support",
            "photo_path": "/avatars/9.jpg",
            "course": 3,
            "department": "Физика моря",
            "location_name": "Коворкинг",
            "bio_raw": "Чувствуешь выгорание? Поговорим. Проходила через это, знаю как найти психолога в МГУ.",
            "tags_array": ["выгорание", "психолог", "поддержка", "саппорт"],
            "trust_score": 4.9,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(hours=1)
        },
        {
            "full_name": "Кирилл Романов",
            "telegram_username": "@kirill_consult",
            "photo_path": "/avatars/10.jpg",
            "course": 5,
            "department": "Теорфизика",
            "location_name": "ГЗ",
            "bio_raw": "Хочу в консалтинг после физфака. Готовлюсь к кейс-интервью в McKinsey.",
            "tags_array": ["консалтинг", "кейс", "работа", "карьера"],
            "trust_score": 4.3,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(hours=10)
        },
        {
            "full_name": "Евгения Смирнова",
            "telegram_username": "@jenia_budget",
            "photo_path": "/avatars/11.jpg",
            "course": 2,
            "department": "Общая физика",
            "location_name": "Деканат",
            "bio_raw": "Перевелась с платного на бюджет. Подскажу, какие оценки нужны для комиссии.",
            "tags_array": ["бюджет", "перевод", "комиссия", "учеба"],
            "trust_score": 4.7,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(days=1)
        },
        {
            "full_name": "Максим Степанов",
            "telegram_username": "@max_hpc",
            "photo_path": "/avatars/12.jpg",
            "course": 4,
            "department": "Компьютерные методы",
            "location_name": "ОИЯИ Дубна",
            "bio_raw": "Высокопроизводительные вычисления. Занимался расчетами в ОИЯИ. Помогу с параллелизмом.",
            "tags_array": ["HPC", "ОИЯИ", "вычисления", "C++", "наука"],
            "trust_score": 4.8,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(hours=4)
        },
        {
            "full_name": "Юлия Орлова",
            "telegram_username": "@julia_vmk",
            "photo_path": "/avatars/13.jpg",
            "course": 3,
            "department": "Фотоника",
            "location_name": "ВМК",
            "bio_raw": "Перепоступала с ВМК на физфак. Знаю разницу в программе и помогу с выбором.",
            "tags_array": ["ВМК", "перепоступление", "учеба", "выбор"],
            "trust_score": 4.5,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(days=3)
        },
        {
            "full_name": "Артем Соколов",
            "telegram_username": "@artem_tutor",
            "photo_path": "/avatars/14.jpg",
            "course": 2,
            "department": "Биофизика",
            "location_name": "Библиотека ГЗ",
            "bio_raw": "Работаю репетитором по физике. Подскажу проверенные конторы для подработки.",
            "tags_array": ["репетитор", "подработка", "работа", "деньги"],
            "trust_score": 4.6,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(minutes=15)
        },
        {
            "full_name": "Софья Лисина",
            "telegram_username": "@sonya_grant",
            "photo_path": "/avatars/15.jpg",
            "course": 6,
            "department": "Квантовая электроника",
            "location_name": "Лаба квантовых технологий",
            "bio_raw": "Получила грант РНФ. Помогу с оформлением заявки и документами для молодых ученых.",
            "tags_array": ["грант", "РНФ", "наука", "документы"],
            "trust_score": 4.9,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(hours=12)
        },
        {
            "full_name": "Роман Котов",
            "telegram_username": "@roman_stip",
            "photo_path": "/avatars/16.jpg",
            "course": 3,
            "department": "Космические лучи",
            "location_name": "НИИЯФ",
            "bio_raw": "Спец по социальной стипендии. Расскажу как выжить на физфаке, если ты иногородний.",
            "tags_array": ["стипендия", "соцпомощь", "ГЗ", "общага", "админка"],
            "trust_score": 4.4,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(days=2)
        },
        {
            "full_name": "Павел Зайцев",
            "telegram_username": "@pavel_startup",
            "photo_path": "/avatars/17.jpg",
            "course": 4,
            "department": "Наноэлектроника",
            "location_name": "Коворкинг",
            "bio_raw": "Делаю хардверный стартап на базе факультета. Ищу блокчейн-разработчиков и инженеров.",
            "tags_array": ["стартап", "блокчейн", "инженерия", "бизнес"],
            "trust_score": 4.7,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(hours=5)
        },
        {
            "full_name": "Татьяна Сорокина",
            "telegram_username": "@tanya_psych",
            "photo_path": "/avatars/18.jpg",
            "course": 5,
            "department": "Полимеры",
            "location_name": "ГЗ",
            "bio_raw": "Помогу найти психологическую поддержку в МГУ. Не бойся писать, если плохо морально.",
            "tags_array": ["психология", "помощь", "поддержка", "здоровье"],
            "trust_score": 5.0,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(minutes=10)
        },
        {
            "full_name": "Илья Громов",
            "telegram_username": "@ilya_router",
            "photo_path": "/avatars/19.jpg",
            "course": 3,
            "department": "Полупроводники",
            "location_name": "Общага ДАС/ГЗ",
            "bio_raw": "Разбираюсь в настройке роутеров vuzhub. Помогу с интернетом в общаге.",
            "tags_array": ["роутер", "vuzhub", "интернет", "общага", "быт"],
            "trust_score": 4.3,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(hours=8)
        },
        {
            "full_name": "Олеся Павлова",
            "telegram_username": "@olesya_flat",
            "photo_path": "/avatars/20.jpg",
            "course": 2,
            "department": "Атмосфера",
            "location_name": "м. Университет",
            "bio_raw": "Ищу соседей для съема квартиры у метро Университет. Знаю как искать жилье.",
            "tags_array": ["квартира", "жилье", "соседи", "университет"],
            "trust_score": 4.6,
            "is_mentor": True,
            "last_active": datetime.datetime.utcnow() - datetime.timedelta(days=1)
        }
    ]

    for student_data in test_students:
        user = User(**student_data)
        db.add(user)
        db.flush()
        # Обновляем полнотекстовый поиск
        db.execute(
            text("UPDATE users SET search_vector = to_tsvector('russian', :text) WHERE id = :id"),
            {"text": user.full_name + " " + (user.bio_raw or ""), "id": user.id}
        )
    
    db.commit()
    print(f"Successfully added {len(test_students)} full profiles.")
    db.close()

if __name__ == "__main__":
    seed()
