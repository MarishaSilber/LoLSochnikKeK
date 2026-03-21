import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, SmallInteger, Boolean, Float, DateTime, ARRAY, func
from sqlalchemy.dialects.postgresql import UUID, TSVECTOR
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    full_name = Column(String(150), nullable=False, index=True)
    telegram_username = Column(String(50), unique=True, index=True)
    photo_path = Column(String(255), nullable=True)
    course = Column(SmallInteger, nullable=False, default=1)
    department = Column(String(100), nullable=True, index=True)
    is_mentor = Column(Boolean, default=False, server_default="false")
    location_name = Column(String(100), nullable=True)
    bio_raw = Column(Text, nullable=True)
    tags_array = Column(ARRAY(String), nullable=True, default=[])
    semantic_embedding = Column(Vector(1536), nullable=True)
    trust_score = Column(Float, default=0.0, server_default="0.0")
    last_active = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    search_vector = Column(TSVECTOR, nullable=True)
    reviews_given = relationship("Review", foreign_keys="Review.reviewer_id", back_populates="reviewer")
    reviews_received = relationship("Review", foreign_keys="Review.reviewed_id", back_populates="reviewed")

class Review(Base):
    __tablename__ = "reviews"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    reviewed_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    score = Column(Float, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="reviews_given")
    reviewed = relationship("User", foreign_keys=[reviewed_id], back_populates="reviews_received")
