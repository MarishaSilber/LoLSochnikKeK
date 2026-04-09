import uuid

from pgvector.sqlalchemy import Vector
from sqlalchemy import ARRAY, Boolean, Column, DateTime, Float, ForeignKey, Integer, SmallInteger, String, Text, func
from sqlalchemy.dialects.postgresql import TSVECTOR, UUID
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=True)
    must_change_password = Column(Boolean, default=False, server_default="false")
    full_name = Column(String(150), nullable=False, index=True, default="Новый пользователь")
    telegram_username = Column(String(50), unique=True, index=True, nullable=True)
    photo_path = Column(String(255), nullable=True)
    course = Column(SmallInteger, nullable=False, default=1)
    department = Column(String(100), nullable=True, index=True)
    is_mentor = Column(Boolean, default=False, server_default="false")
    is_admin = Column(Boolean, default=False, server_default="false")
    is_hidden = Column(Boolean, default=False, server_default="false")
    is_profile_complete = Column(Boolean, default=False, server_default="false")
    accepted_terms_at = Column(DateTime(timezone=True), nullable=True)
    accepted_terms_version = Column(String(32), nullable=True)
    accepted_privacy_policy_at = Column(DateTime(timezone=True), nullable=True)
    accepted_privacy_policy_version = Column(String(32), nullable=True)
    location_name = Column(String(100), nullable=True)
    bio_raw = Column(Text, nullable=True)
    tags_array = Column(ARRAY(String), nullable=True, default=[])
    semantic_embedding = Column(Vector(1536), nullable=True)
    trust_score = Column(Float, default=0.0, server_default="0.0")
    last_active = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    search_vector = Column(TSVECTOR, nullable=True)

    reviews_given = relationship("Review", foreign_keys="Review.reviewer_id", back_populates="reviewer")
    reviews_received = relationship("Review", foreign_keys="Review.reviewed_id", back_populates="reviewed")
    admin_actions = relationship("AdminAuditLog", foreign_keys="AdminAuditLog.admin_id", back_populates="admin")


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


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    target_user_id = Column(UUID(as_uuid=True), nullable=True)
    action = Column(String(64), nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    admin = relationship("User", foreign_keys=[admin_id], back_populates="admin_actions")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    kind = Column(String(20), nullable=False, index=True)  # direct | support
    direct_user_a_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    direct_user_b_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    support_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    archived_for_user_a = Column(Boolean, default=False, server_default="false")
    archived_for_user_b = Column(Boolean, default=False, server_default="false")
    archived_for_admin = Column(Boolean, default=False, server_default="false")
    last_message_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False, index=True)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
