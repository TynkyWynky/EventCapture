"""Baseline schema for EventCapture fresh installs.

Revision ID: 20260509_0001
Revises:
Create Date: 2026-05-09 20:25:00
"""

from __future__ import annotations

from alembic import op

from backend.database import Base


revision = "20260509_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)
