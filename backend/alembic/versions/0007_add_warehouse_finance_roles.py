"""Add WAREHOUSE and FINANCE to UserRole enum in users table

Revision ID: 0007
Revises: 0006
Create Date: 2026-10-07
"""
from alembic import op
import sqlalchemy as sa

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    dialect = conn.dialect.name
    if dialect == "mysql":
        op.execute(
            "ALTER TABLE users MODIFY COLUMN role ENUM('ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'FINANCE') NOT NULL"
        )


def downgrade() -> None:
    conn = op.get_bind()
    dialect = conn.dialect.name
    if dialect == "mysql":
        op.execute(
            "ALTER TABLE users MODIFY COLUMN role ENUM('ADMIN', 'MANAGER', 'SALES') NOT NULL"
        )
