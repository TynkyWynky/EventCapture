"""First-customer hardening tables and support workflow fields.

Revision ID: 20260510_0002
Revises: 20260509_0001
Create Date: 2026-05-10 09:00:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260510_0002"
down_revision = "20260509_0001"
branch_labels = None
depends_on = None


def _table_names(bind) -> set[str]:
    inspector = sa.inspect(bind)
    return set(inspector.get_table_names())


def _column_names(bind, table_name: str) -> set[str]:
    inspector = sa.inspect(bind)
    return {column["name"] for column in inspector.get_columns(table_name)}


def _index_names(bind, table_name: str) -> set[str]:
    inspector = sa.inspect(bind)
    return {index["name"] for index in inspector.get_indexes(table_name)}


def upgrade() -> None:
    bind = op.get_bind()
    tables = _table_names(bind)

    if "support_requests" in tables:
        columns = _column_names(bind, "support_requests")
        if "priority" not in columns:
            with op.batch_alter_table("support_requests") as batch_op:
                batch_op.add_column(sa.Column("priority", sa.String(length=16), nullable=False, server_default="normal"))
                batch_op.create_index("ix_support_requests_priority", ["priority"], unique=False)
            op.execute("UPDATE support_requests SET priority = 'normal' WHERE priority IS NULL")
        op.execute("UPDATE support_requests SET status = 'new' WHERE status = 'open'")

    if "support_request_notes" not in tables:
        op.create_table(
            "support_request_notes",
            sa.Column("id", sa.String(length=32), nullable=False),
            sa.Column("support_request_id", sa.String(length=32), nullable=False),
            sa.Column("author_user_id", sa.String(length=32), nullable=True),
            sa.Column("note", sa.Text(), nullable=False),
            sa.Column("is_internal", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["author_user_id"], ["users.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["support_request_id"], ["support_requests.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_support_request_notes_support_request_id", "support_request_notes", ["support_request_id"], unique=False)
        op.create_index("ix_support_request_notes_author_user_id", "support_request_notes", ["author_user_id"], unique=False)
        op.create_index("ix_support_request_notes_created_at", "support_request_notes", ["created_at"], unique=False)

    if "rate_limit_buckets" not in tables:
        op.create_table(
            "rate_limit_buckets",
            sa.Column("bucket_key", sa.String(length=255), nullable=False),
            sa.Column("scope", sa.String(length=64), nullable=False),
            sa.Column("actor_type", sa.String(length=32), nullable=False),
            sa.Column("actor_value", sa.String(length=255), nullable=False),
            sa.Column("request_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("window_started_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.PrimaryKeyConstraint("bucket_key"),
        )
        op.create_index("ix_rate_limit_buckets_scope", "rate_limit_buckets", ["scope"], unique=False)
        op.create_index("ix_rate_limit_buckets_actor_type", "rate_limit_buckets", ["actor_type"], unique=False)
        op.create_index("ix_rate_limit_buckets_actor_value", "rate_limit_buckets", ["actor_value"], unique=False)
        op.create_index("ix_rate_limit_buckets_expires_at", "rate_limit_buckets", ["expires_at"], unique=False)

    if "revoked_access_tokens" in tables:
        indexes = _index_names(bind, "revoked_access_tokens")
        if "ix_revoked_access_tokens_expires_at" not in indexes:
            op.create_index("ix_revoked_access_tokens_expires_at", "revoked_access_tokens", ["expires_at"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    tables = _table_names(bind)

    if "support_request_notes" in tables:
        op.drop_table("support_request_notes")
    if "rate_limit_buckets" in tables:
        op.drop_table("rate_limit_buckets")

