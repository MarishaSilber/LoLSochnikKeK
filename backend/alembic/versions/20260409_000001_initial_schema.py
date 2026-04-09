"""initial schema

Revision ID: 20260409_000001
Revises:
Create Date: 2026-04-09 11:00:00
"""

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector
from sqlalchemy.dialects import postgresql


revision = "20260409_000001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")

    if "users" not in existing_tables:
        op.create_table(
            "users",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("email", sa.String(length=255), nullable=True),
            sa.Column("password_hash", sa.String(length=255), nullable=True),
            sa.Column("must_change_password", sa.Boolean(), server_default=sa.text("false"), nullable=True),
            sa.Column("full_name", sa.String(length=150), nullable=False),
            sa.Column("telegram_username", sa.String(length=50), nullable=True),
            sa.Column("photo_path", sa.String(length=255), nullable=True),
            sa.Column("course", sa.SmallInteger(), nullable=False),
            sa.Column("department", sa.String(length=100), nullable=True),
            sa.Column("is_mentor", sa.Boolean(), server_default=sa.text("false"), nullable=True),
            sa.Column("is_admin", sa.Boolean(), server_default=sa.text("false"), nullable=True),
            sa.Column("is_hidden", sa.Boolean(), server_default=sa.text("false"), nullable=True),
            sa.Column("is_profile_complete", sa.Boolean(), server_default=sa.text("false"), nullable=True),
            sa.Column("accepted_terms_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("accepted_terms_version", sa.String(length=32), nullable=True),
            sa.Column("accepted_privacy_policy_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("accepted_privacy_policy_version", sa.String(length=32), nullable=True),
            sa.Column("location_name", sa.String(length=100), nullable=True),
            sa.Column("bio_raw", sa.Text(), nullable=True),
            sa.Column("tags_array", postgresql.ARRAY(sa.String()), nullable=True),
            sa.Column("semantic_embedding", Vector(1536), nullable=True),
            sa.Column("trust_score", sa.Float(), server_default=sa.text("0.0"), nullable=True),
            sa.Column("last_active", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.Column("search_vector", postgresql.TSVECTOR(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )

    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_profile_complete BOOLEAN DEFAULT FALSE;")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS accepted_terms_at TIMESTAMPTZ;")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS accepted_terms_version VARCHAR(32);")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS accepted_privacy_policy_at TIMESTAMPTZ;")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS accepted_privacy_policy_version VARCHAR(32);")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS semantic_embedding vector(1536);")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;")
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email) WHERE email IS NOT NULL;")
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_telegram_username ON users(telegram_username);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_users_department ON users(department);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_users_full_name ON users(full_name);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_users_search_vector ON users USING GIN(search_vector);")

    if "admin_audit_logs" not in existing_tables:
        op.create_table(
            "admin_audit_logs",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("admin_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("target_user_id", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("action", sa.String(length=64), nullable=False),
            sa.Column("details", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["admin_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    if "conversations" not in existing_tables:
        op.create_table(
            "conversations",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("kind", sa.String(length=20), nullable=False),
            sa.Column("direct_user_a_id", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("direct_user_b_id", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("support_user_id", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("archived_for_user_a", sa.Boolean(), server_default=sa.text("false"), nullable=True),
            sa.Column("archived_for_user_b", sa.Boolean(), server_default=sa.text("false"), nullable=True),
            sa.Column("archived_for_admin", sa.Boolean(), server_default=sa.text("false"), nullable=True),
            sa.Column("last_message_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["direct_user_a_id"], ["users.id"]),
            sa.ForeignKeyConstraint(["direct_user_b_id"], ["users.id"]),
            sa.ForeignKeyConstraint(["support_user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    op.execute("ALTER TABLE conversations ADD COLUMN IF NOT EXISTS archived_for_user_a BOOLEAN DEFAULT FALSE;")
    op.execute("ALTER TABLE conversations ADD COLUMN IF NOT EXISTS archived_for_user_b BOOLEAN DEFAULT FALSE;")
    op.execute("ALTER TABLE conversations ADD COLUMN IF NOT EXISTS archived_for_admin BOOLEAN DEFAULT FALSE;")
    op.execute("ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ DEFAULT NOW();")
    op.execute("CREATE INDEX IF NOT EXISTS ix_conversations_direct_user_a_id ON conversations(direct_user_a_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_conversations_direct_user_b_id ON conversations(direct_user_b_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_conversations_kind ON conversations(kind);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_conversations_support_user_id ON conversations(support_user_id);")

    if "reviews" not in existing_tables:
        op.create_table(
            "reviews",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("reviewer_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("reviewed_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("score", sa.Float(), nullable=False),
            sa.Column("comment", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.ForeignKeyConstraint(["reviewed_id"], ["users.id"]),
            sa.ForeignKeyConstraint(["reviewer_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    if "chat_messages" not in existing_tables:
        op.create_table(
            "chat_messages",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("conversation_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("sender_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("body", sa.Text(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["conversation_id"], ["conversations.id"]),
            sa.ForeignKeyConstraint(["sender_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    op.execute("CREATE INDEX IF NOT EXISTS ix_chat_messages_conversation_id ON chat_messages(conversation_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_chat_messages_sender_id ON chat_messages(sender_id);")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_chat_messages_sender_id;")
    op.execute("DROP INDEX IF EXISTS ix_chat_messages_conversation_id;")
    op.drop_table("chat_messages")
    op.drop_table("reviews")
    op.execute("DROP INDEX IF EXISTS ix_conversations_support_user_id;")
    op.execute("DROP INDEX IF EXISTS ix_conversations_kind;")
    op.execute("DROP INDEX IF EXISTS ix_conversations_direct_user_b_id;")
    op.execute("DROP INDEX IF EXISTS ix_conversations_direct_user_a_id;")
    op.drop_table("conversations")
    op.drop_table("admin_audit_logs")
    op.execute("DROP INDEX IF EXISTS idx_users_search_vector;")
    op.execute("DROP INDEX IF EXISTS ix_users_telegram_username;")
    op.execute("DROP INDEX IF EXISTS ix_users_full_name;")
    op.execute("DROP INDEX IF EXISTS ix_users_department;")
    op.execute("DROP INDEX IF EXISTS idx_users_email_unique;")
    op.drop_table("users")
