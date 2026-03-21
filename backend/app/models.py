from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, Index, func, SmallInteger
from sqlalchemy.dialects.postgresql import ARRAY, TSVECTOR
from pgvector.sqlalchemy import Vector
from .database import Base
import datetime


class User(Base):
    __tablename__ = "users"

    # Identity
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    telegram_username = Column(String(50), nullable=True)
    photo_path = Column(String(255), nullable=True)

    # Attributes
    course = Column(SmallInteger, nullable=True) # 1-6. Вес: 2.0
    department = Column(String(100), nullable=True) # Кафедра. Вес: 0.5
    is_mentor = Column(Boolean, default=True) # Фильтр

    # Location
    location_name = Column(String(100), nullable=True) # Напр. "ГЗ", "5-18". Вес: 0.8
    
    # Content
    bio_raw = Column(Text, nullable=True) # Сырое описание

    # AI Metrics
    tags_array = Column(ARRAY(String), nullable=True) # Вес: 1.5
    semantic_embedding = Column(Vector(1536), nullable=True) # Вес: 1.0 (OpenAI)
    
    # Social & System
    trust_score = Column(Float, default=0.0) # Карма. Вес: 0.3
    last_active = Column(DateTime, default=datetime.datetime.utcnow) # Вес: 0.4
    
    # Search
    search_vector = Column(TSVECTOR, nullable=True) # Postgres FTS

    # Индексы для ускорения
    __table_args__ = (
        Index("ix_users_tags", "tags_array", postgresql_using="gin"),
        Index("ix_users_search_vector", "search_vector", postgresql_using="gin"),
        # Индекс для векторного поиска (HNSW для скорости)
        Index("ix_users_embedding", "semantic_embedding", postgresql_using="hnsw", postgresql_with={"m": 16, "ef_construction": 64}),
    )


class RequestHistory(Base):
    __tablename__ = "request_history"

    id = Column(Integer, primary_key=True, index=True)
    raw_text = Column(Text, nullable=False)
    parsed_json = Column(Text, nullable=True) # Результат работы LLM
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
