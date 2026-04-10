"""add email verification and action tokens

Revision ID: 20260410_000002
Revises: 20260409_000001
Create Date: 2026-04-10 17:00:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260410_000002"
down_revision = "20260409_000001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE NOT NULL;")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;")
    op.execute("UPDATE users SET is_email_verified = TRUE, email_verified_at = COALESCE(email_verified_at, NOW()) WHERE email IS NOT NULL;")

    op.create_table(
        "email_action_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("action", sa.String(length=32), nullable=False),
        sa.Column("token_hash", sa.String(length=255), nullable=False),
        sa.Column("payload_json", sa.Text(), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index("ix_email_action_tokens_action", "email_action_tokens", ["action"], unique=False)
    op.create_index("ix_email_action_tokens_email", "email_action_tokens", ["email"], unique=False)
    op.create_index("ix_email_action_tokens_expires_at", "email_action_tokens", ["expires_at"], unique=False)
    op.create_index("ix_email_action_tokens_token_hash", "email_action_tokens", ["token_hash"], unique=True)
    op.create_index("ix_email_action_tokens_used_at", "email_action_tokens", ["used_at"], unique=False)
    op.create_index("ix_email_action_tokens_user_id", "email_action_tokens", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_email_action_tokens_user_id", table_name="email_action_tokens")
    op.drop_index("ix_email_action_tokens_used_at", table_name="email_action_tokens")
    op.drop_index("ix_email_action_tokens_token_hash", table_name="email_action_tokens")
    op.drop_index("ix_email_action_tokens_expires_at", table_name="email_action_tokens")
    op.drop_index("ix_email_action_tokens_email", table_name="email_action_tokens")
    op.drop_index("ix_email_action_tokens_action", table_name="email_action_tokens")
    op.drop_table("email_action_tokens")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS email_verified_at;")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS is_email_verified;")
