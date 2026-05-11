"""Repair legacy event social and support schema drift.

Revision ID: 20260511_0003
Revises: 20260510_0002
Create Date: 2026-05-11 10:30:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260511_0003"
down_revision = "20260510_0002"
branch_labels = None
depends_on = None


def _table_names(bind) -> set[str]:
    inspector = sa.inspect(bind)
    return set(inspector.get_table_names())


def _column_names(bind, table_name: str) -> set[str]:
    inspector = sa.inspect(bind)
    return {column["name"] for column in inspector.get_columns(table_name)}


def upgrade() -> None:
    bind = op.get_bind()
    tables = _table_names(bind)

    if "event_comments" in tables:
        columns = _column_names(bind, "event_comments")
        if "time_label" not in columns:
            with op.batch_alter_table("event_comments") as batch_op:
                batch_op.add_column(
                    sa.Column("time_label", sa.String(length=64), nullable=False, server_default="Just now")
                )
            op.execute(
                "UPDATE event_comments SET time_label = 'Just now' WHERE time_label IS NULL OR time_label = ''"
            )

    if "support_requests" in tables:
        columns = _column_names(bind, "support_requests")
        if "priority" not in columns:
            with op.batch_alter_table("support_requests") as batch_op:
                batch_op.add_column(
                    sa.Column("priority", sa.String(length=16), nullable=False, server_default="normal")
                )
            op.execute(
                "UPDATE support_requests SET priority = 'normal' WHERE priority IS NULL OR priority = ''"
            )
        op.execute("UPDATE support_requests SET status = 'new' WHERE status = 'open'")


def downgrade() -> None:
    # This migration repairs legacy local schemas. It is intentionally non-destructive.
    pass
