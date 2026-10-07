"""Create dynamic roles table and add role_id foreign key to users

Revision ID: 0008
Revises: 0007
Create Date: 2026-10-07
"""
from alembic import op
import sqlalchemy as sa

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    # 1. Create roles table if it doesn't exist
    if "roles" not in tables:
        op.create_table(
            "roles",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("name", sa.String(length=50), nullable=False),
            sa.Column("display_name", sa.String(length=100), nullable=False),
            sa.Column("description", sa.String(length=255), nullable=True),
            sa.Column("is_system", sa.Boolean(), server_default=sa.text("0"), nullable=False),
            sa.Column("allowed_screens", sa.String(length=500), server_default="dashboard", nullable=False),
            sa.Column("can_create_orders", sa.Boolean(), server_default=sa.text("0"), nullable=False),
            sa.Column("can_approve_orders", sa.Boolean(), server_default=sa.text("0"), nullable=False),
            sa.Column("can_adjust_stock", sa.Boolean(), server_default=sa.text("0"), nullable=False),
            sa.Column("can_manage_products", sa.Boolean(), server_default=sa.text("0"), nullable=False),
            sa.Column("can_manage_customers", sa.Boolean(), server_default=sa.text("0"), nullable=False),
            sa.Column("can_manage_users", sa.Boolean(), server_default=sa.text("0"), nullable=False),
            sa.Column("can_manage_settings", sa.Boolean(), server_default=sa.text("0"), nullable=False),
            sa.Column("can_view_audit", sa.Boolean(), server_default=sa.text("0"), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_roles_id"), "roles", ["id"], unique=False)
        op.create_index(op.f("ix_roles_name"), "roles", ["name"], unique=True)

    # 2. Add role_id column to users table if not present
    user_columns = [c["name"] for c in inspector.get_columns("users")]
    if "role_id" not in user_columns:
        op.add_column(
            "users",
            sa.Column("role_id", sa.Integer(), nullable=True),
        )
        op.create_index(op.f("ix_users_role_id"), "users", ["role_id"], unique=False)

    # 3. In MySQL, convert users.role from rigid ENUM to flexible VARCHAR(50) for dynamic roles
    dialect = conn.dialect.name
    if dialect == "mysql":
        op.execute("ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT 'SALES'")


def downgrade() -> None:
    conn = op.get_bind()
    dialect = conn.dialect.name
    if dialect == "mysql":
        op.execute("ALTER TABLE users MODIFY COLUMN role ENUM('ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'FINANCE') NOT NULL")

    op.drop_column("users", "role_id")
    op.drop_table("roles")
