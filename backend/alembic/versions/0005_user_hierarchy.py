"""Add hierarchy and super admin fields to users

Revision ID: 0005
Revises: 0004
Create Date: 2026-10-06
"""
from alembic import op
import sqlalchemy as sa

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c["name"] for c in inspector.get_columns("users")]
    
    if "is_super_admin" not in columns:
        op.add_column("users", sa.Column("is_super_admin", sa.Boolean(), nullable=False, server_default=sa.text("0")))
    if "manager_id" not in columns:
        op.add_column("users", sa.Column("manager_id", sa.Integer(), nullable=True))
    if "created_by_id" not in columns:
        op.add_column("users", sa.Column("created_by_id", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "created_by_id")
    op.drop_column("users", "manager_id")
    op.drop_column("users", "is_super_admin")
