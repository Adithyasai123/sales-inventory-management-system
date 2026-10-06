"""Add sequences table for atomic order number generation

Revision ID: 0003
Revises: 0002
Create Date: 2026-10-06
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "sequences",
        sa.Column("name", sa.String(50), primary_key=True, nullable=False),
        sa.Column("last_value", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_table("sequences")
