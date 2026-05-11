"""Restore denormalized post display fields for existing databases.

Revision ID: 20260511_0004
Revises: 20260511_0003
Create Date: 2026-05-11 18:05:00
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect


revision = "20260511_0004"
down_revision = "20260511_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("posts")}

    if "username" not in columns:
        op.add_column(
            "posts",
            sa.Column("username", sa.String(length=64), nullable=False, server_default="EventCapture user"),
        )
    if "avatar_uri" not in columns:
        op.add_column(
            "posts",
            sa.Column("avatar_uri", sa.Text(), nullable=False, server_default=""),
        )

    bind.execute(
        sa.text(
            """
            UPDATE posts
            SET username = COALESCE(
                NULLIF(TRIM((SELECT users.username FROM users WHERE users.id = posts.user_id)), ''),
                NULLIF(TRIM((SELECT users.full_name FROM users WHERE users.id = posts.user_id)), ''),
                NULLIF(TRIM((SELECT users.email FROM users WHERE users.id = posts.user_id)), ''),
                'EventCapture user'
            )
            WHERE username IS NULL OR TRIM(username) = ''
            """
        )
    )
    bind.execute(
        sa.text(
            """
            UPDATE posts
            SET avatar_uri = COALESCE(
                (SELECT users.avatar_uri FROM users WHERE users.id = posts.user_id),
                ''
            )
            WHERE avatar_uri IS NULL
            """
        )
    )


def downgrade() -> None:
    pass
