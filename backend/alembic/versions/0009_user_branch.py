"""Add branch column to users table

Revision ID: 0009
Revises: 0008
Create Date: 2026-10-07
"""
from alembic import op
import sqlalchemy as sa

revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c["name"] for c in inspector.get_columns("users")]
    
    if "branch" not in columns:
        op.add_column("users", sa.Column("branch", sa.String(100), nullable=True, server_default="Hyderabad"))


def downgrade() -> None:
    op.drop_column("users", "branch")
