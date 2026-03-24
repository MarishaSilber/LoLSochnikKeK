#!/usr/bin/env python3
"""Seed script to populate database with test users."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Base, User
from uuid import uuid4

# Test data - 20 students
STUDENTS = [
    {
        "full_name": "Алексей Иванов",
        "telegram_username": "@alex_i",
        "course": 2,
        "department": "Общая физика",
        "location_name": "Читалка 4 этаж",
        "bio_raw": "Знаю матан Савченко назубок, помогу не вылететь на 2 курсе. Шарю в диффурах и тензорах.",
        "tags_array": ["матан", "Савченко", "диффуры", "тензорный_анализ"],
        "trust_score": 4.9,
    },
    {
        "full_name": "Мария Сидорова",
        "telegram_username": "@masha_ds",
        "course": 4,
        "department": "Математика",
        "location_name": "Коворкинг 5-18",
        "bio_raw": "Стажировалась в Яндексе. Помогу собрать резюме для Data Science и пройти собес на Python.",
        "tags_array": ["ML", "Python", "Яндекс", "Data_Science", "собеседование"],
        "trust_score": 5.0,
    },
    {
        "full_name": "Игорь Петров",
        "telegram_username": "@igor_quantum",
        "course": 5,
        "department": "Квантовая электроника",
        "location_name": "Лаборатория 3-25",
        "bio_raw": "Занимаюсь квантовыми технологиями. Объясню Шредингера и помогу с квантами.",
        "tags_array": ["кванты", "фотоника", "Шредингер", "наука"],
        "trust_score": 4.7,
    },
    {
        "full_name": "Елена Кузнецова",
        "telegram_username": "@lena_bio",
        "course": 3,
        "department": "Биофизика",
        "location_name": "Биолаб 2-10",
        "bio_raw": "Исследую белки. Помогу с биохимией и молекулярной биологией.",
        "tags_array": ["биофизика", "белки", "биохимия", "молекулярка"],
        "trust_score": 4.5,
    },
    {
        "full_name": "Дмитрий Волков",
        "telegram_username": "@dima_code",
        "course": 3,
        "department": "Прикладная математика",
        "location_name": "Компьютерный класс 1-05",
        "bio_raw": "Пишу на C++ и Python. Помогу с алгоритмами и структурами данных.",
        "tags_array": ["C++", "Python", "алгоритмы", "программирование"],
        "trust_score": 4.8,
    },
    {
        "full_name": "Анна Морозова",
        "telegram_username": "@anya_phys",
        "course": 4,
        "department": "Теоретическая физика",
        "location_name": "Читалка 3 этаж",
        "bio_raw": "Люблю теоретическую физику. Объясню термех и электродинамику.",
        "tags_array": ["термех", "электродинамика", "теорфиз", "механика"],
        "trust_score": 4.6,
    },
    {
        "full_name": "Сергей Новиков",
        "telegram_username": "@sergey_ml",
        "course": 5,
        "department": "Искусственный интеллект",
        "location_name": "AI Lab 4-30",
        "bio_raw": "Занимаюсь машинным обучением. Помогу с нейронками и матстатом.",
        "tags_array": ["ML", "нейросети", "матстат", "PyTorch"],
        "trust_score": 5.0,
    },
    {
        "full_name": "Ольга Соколова",
        "telegram_username": "@olga_chem",
        "course": 2,
        "department": "Химическая физика",
        "location_name": "Химлаб 1-20",
        "bio_raw": "Помогу с химией и физической химией. Готова объяснять долго и терпеливо.",
        "tags_array": ["химия", "физхимия", "реакции", "лабораторные"],
        "trust_score": 4.4,
    },
    {
        "full_name": "Максим Лебедев",
        "telegram_username": "@max_radio",
        "course": 3,
        "department": "Радиофизика",
        "location_name": "Радиолаб 2-15",
        "bio_raw": "Разбираюсь в радиотехнике и электронике. Помогу с схемами и сигналами.",
        "tags_array": ["радиотехника", "электроника", "сигналы", "схемы"],
        "trust_score": 4.3,
    },
    {
        "full_name": "Наталья Орлова",
        "telegram_username": "@nat_stats",
        "course": 4,
        "department": "Статистика",
        "location_name": "Коворкинг 3-12",
        "bio_raw": "Мастер статистики. Помогу с R, Python и статистическим анализом.",
        "tags_array": ["статистика", "R", "анализ_данных", "визуализация"],
        "trust_score": 4.7,
    },
    {
        "full_name": "Артём Жуков",
        "telegram_username": "@artem_web",
        "course": 2,
        "department": "Программная инженерия",
        "location_name": "Коворкинг 2-08",
        "bio_raw": "Веб-разработчик. Помогу с React, Node.js и базами данных.",
        "tags_array": ["React", "Node.js", "веб", "базы_данных"],
        "trust_score": 4.5,
    },
    {
        "full_name": "Виктория Павлова",
        "telegram_username": "@vika_math",
        "course": 3,
        "department": "Математическое моделирование",
        "location_name": "Читалка 2 этаж",
        "bio_raw": "Люблю матмоделирование. Помогу с дифурами и численными методами.",
        "tags_array": ["матмод", "диффуры", "численные_методы", "Python"],
        "trust_score": 4.6,
    },
    {
        "full_name": "Кирилл Григорьев",
        "telegram_username": "@kirill_optics",
        "course": 5,
        "department": "Оптика",
        "location_name": "Оптиколаб 4-18",
        "bio_raw": "Занимаюсь лазерной физикой. Объясню оптику и фотонику.",
        "tags_array": ["оптика", "лазеры", "фотоника", "физика"],
        "trust_score": 4.8,
    },
    {
        "full_name": "Евгения Романова",
        "telegram_username": "@zhenya_eco",
        "course": 2,
        "department": "Экологическая физика",
        "location_name": "Эколаб 1-12",
        "bio_raw": "Изучаю экологию и климат. Помогу с экомониторингом и анализом данных.",
        "tags_array": ["экология", "климат", "мониторинг", "данные"],
        "trust_score": 4.2,
    },
    {
        "full_name": "Павел Федоров",
        "telegram_username": "@pasha_embedded",
        "course": 4,
        "department": "Встроенные системы",
        "location_name": "Лаборатория 3-22",
        "bio_raw": "Разрабатываю встроенные системы. Помогу с Arduino, STM32 и C.",
        "tags_array": ["embedded", "Arduino", "STM32", "C"],
        "trust_score": 4.7,
    },
    {
        "full_name": "Дарья Александрова",
        "telegram_username": "@dasha_nano",
        "course": 5,
        "department": "Нанотехнологии",
        "location_name": "Нанолаб 2-30",
        "bio_raw": "Исследую наноматериалы. Помогу с материаловедением и химией.",
        "tags_array": ["нанотех", "материаловедение", "химия", "исследования"],
        "trust_score": 4.9,
    },
    {
        "full_name": "Тимофей Васильев",
        "telegram_username": "@tima_astro",
        "course": 3,
        "department": "Астрофизика",
        "location_name": "Планетарий",
        "bio_raw": "Люблю космос. Помогу с астрофизикой и небесной механикой.",
        "tags_array": ["астрофизика", "космос", "механика", "физика"],
        "trust_score": 4.5,
    },
    {
        "full_name": "Ксения Николаева",
        "telegram_username": "@ksenia_med",
        "course": 4,
        "department": "Медицинская физика",
        "location_name": "Медлаб 1-25",
        "bio_raw": "Изучаю медицинскую физику. Помогу с биофизикой и медицинским оборудованием.",
        "tags_array": ["медфизика", "биофизика", "оборудование", "медицина"],
        "trust_score": 4.6,
    },
    {
        "full_name": "Роман Егоров",
        "telegram_username": "@roma_robot",
        "course": 3,
        "department": "Робототехника",
        "location_name": "Роботолаб 3-15",
        "bio_raw": "Создаю роботов. Помогу с механикой, электроникой и программированием.",
        "tags_array": ["роботы", "механика", "электроника", "программирование"],
        "trust_score": 4.8,
    },
    {
        "full_name": "Алина Титова",
        "telegram_username": "@alina_econ",
        "course": 2,
        "department": "Экономика предприятия",
        "location_name": "Читалка 1 этаж",
        "bio_raw": "Помогу с экономикой, менеджментом и анализом бизнес-процессов.",
        "tags_array": ["экономика", "менеджмент", "бизнес", "анализ"],
        "trust_score": 4.3,
    },
]

def seed_db():
    """Seed the database with test users."""
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if data already exists
        existing_count = db.query(User).count()
        if existing_count > 0:
            print(f"Database already has {existing_count} users. Clearing...")
            db.query(User).delete()
            db.commit()
        
        # Add users
        for i, student in enumerate(STUDENTS, start=1):
            user = User(
                id=uuid4(),
                full_name=student["full_name"],
                telegram_username=student["telegram_username"],
                course=student["course"],
                department=student["department"],
                location_name=student["location_name"],
                bio_raw=student["bio_raw"],
                tags_array=student["tags_array"],
                trust_score=student["trust_score"],
                is_mentor=True,
            )
            db.add(user)
            print(f"Added: {student['full_name']}")
        
        db.commit()
        print(f"\n✓ Successfully added {len(STUDENTS)} users to the database!")
        
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
