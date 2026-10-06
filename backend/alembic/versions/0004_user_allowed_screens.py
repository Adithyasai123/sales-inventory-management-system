"""Add allowed_screens column to users table

Revision ID: 0004
Revises: 0003
Create Date: 2026-10-06
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c["name"] for c in inspector.get_columns("users")]
    if "allowed_screens" not in columns:
        op.add_column("users", sa.Column("allowed_screens", sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "allowed_screens")
