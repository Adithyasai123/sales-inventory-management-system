"""Initial schema migration: 3NF tables, constraints, indexes, and triggers

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-10-05 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users table
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=100), nullable=False),
        sa.Column("role", sa.Enum("ADMIN", "MANAGER", "SALES", name="userrole"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("1"), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), server_default=sa.text("0"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_role"), "users", ["role"], unique=False)
    op.create_index(op.f("ix_users_is_deleted"), "users", ["is_deleted"], unique=False)

    # 2. customers table
    op.create_table(
        "customers",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("company", sa.String(length=150), nullable=True),
        sa.Column("address", sa.String(length=255), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column("country", sa.String(length=100), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("1"), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), server_default=sa.text("0"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_customers_id"), "customers", ["id"], unique=False)
    op.create_index(op.f("ix_customers_name"), "customers", ["name"], unique=False)
    op.create_index(op.f("ix_customers_email"), "customers", ["email"], unique=True)
    op.create_index(op.f("ix_customers_is_active"), "customers", ["is_active"], unique=False)
    op.create_index(op.f("ix_customers_is_deleted"), "customers", ["is_deleted"], unique=False)

    # 3. products table
    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("sku", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("cost_price", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("stock_quantity", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("reorder_level", sa.Integer(), server_default=sa.text("10"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("1"), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), server_default=sa.text("0"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.CheckConstraint("stock_quantity >= 0", name="chk_stock_non_negative"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_products_id"), "products", ["id"], unique=False)
    op.create_index(op.f("ix_products_sku"), "products", ["sku"], unique=True)
    op.create_index(op.f("ix_products_name"), "products", ["name"], unique=False)
    op.create_index(op.f("ix_products_category"), "products", ["category"], unique=False)
    op.create_index(op.f("ix_products_is_active"), "products", ["is_active"], unique=False)
    op.create_index(op.f("ix_products_is_deleted"), "products", ["is_deleted"], unique=False)

    # 4. sales_orders table
    op.create_table(
        "sales_orders",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("order_number", sa.String(length=50), nullable=False),
        sa.Column("customer_id", sa.Integer(), nullable=False),
        sa.Column("creator_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.Enum("DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED", name="orderstatus"), nullable=False),
        sa.Column("subtotal", sa.Numeric(precision=12, scale=2), server_default=sa.text("0.00"), nullable=False),
        sa.Column("tax_rate", sa.Numeric(precision=5, scale=2), server_default=sa.text("0.00"), nullable=False),
        sa.Column("tax_amount", sa.Numeric(precision=12, scale=2), server_default=sa.text("0.00"), nullable=False),
        sa.Column("total_amount", sa.Numeric(precision=12, scale=2), server_default=sa.text("0.00"), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("requires_approval", sa.Boolean(), server_default=sa.text("0"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["creator_id"], ["users.id"], ),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_sales_orders_id"), "sales_orders", ["id"], unique=False)
    op.create_index(op.f("ix_sales_orders_order_number"), "sales_orders", ["order_number"], unique=True)
    op.create_index(op.f("ix_sales_orders_customer_id"), "sales_orders", ["customer_id"], unique=False)
    op.create_index(op.f("ix_sales_orders_creator_id"), "sales_orders", ["creator_id"], unique=False)
    op.create_index(op.f("ix_sales_orders_status"), "sales_orders", ["status"], unique=False)
    op.create_index(op.f("ix_sales_orders_total_amount"), "sales_orders", ["total_amount"], unique=False)

    # 5. sales_order_items table
    op.create_table(
        "sales_order_items",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("total_price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["sales_orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_sales_order_items_id"), "sales_order_items", ["id"], unique=False)
    op.create_index(op.f("ix_sales_order_items_order_id"), "sales_order_items", ["order_id"], unique=False)
    op.create_index(op.f("ix_sales_order_items_product_id"), "sales_order_items", ["product_id"], unique=False)

    # 6. order_approvals table
    op.create_table(
        "order_approvals",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("approver_id", sa.Integer(), nullable=False),
        sa.Column("decision", sa.Enum("APPROVED", "REJECTED", name="approvaldecision"), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("decided_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["approver_id"], ["users.id"], ),
        sa.ForeignKeyConstraint(["order_id"], ["sales_orders.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_order_approvals_id"), "order_approvals", ["id"], unique=False)
    op.create_index(op.f("ix_order_approvals_order_id"), "order_approvals", ["order_id"], unique=False)
    op.create_index(op.f("ix_order_approvals_approver_id"), "order_approvals", ["approver_id"], unique=False)
    op.create_index(op.f("ix_order_approvals_decision"), "order_approvals", ["decision"], unique=False)

    # 7. inventory_movements table
    op.create_table(
        "inventory_movements",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("movement_type", sa.Enum("IN", "OUT", "ADJUST", name="movementtype"), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("balance_after", sa.Integer(), nullable=False),
        sa.Column("reference_order_id", sa.Integer(), nullable=True),
        sa.Column("reason", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ),
        sa.ForeignKeyConstraint(["reference_order_id"], ["sales_orders.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_inventory_movements_id"), "inventory_movements", ["id"], unique=False)
    op.create_index(op.f("ix_inventory_movements_product_id"), "inventory_movements", ["product_id"], unique=False)
    op.create_index(op.f("ix_inventory_movements_movement_type"), "inventory_movements", ["movement_type"], unique=False)
    op.create_index(op.f("ix_inventory_movements_reference_order_id"), "inventory_movements", ["reference_order_id"], unique=False)
    op.create_index(op.f("ix_inventory_movements_created_at"), "inventory_movements", ["created_at"], unique=False)

    # 8. email_logs table
    op.create_table(
        "email_logs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("recipient", sa.String(length=255), nullable=False),
        sa.Column("subject", sa.String(length=255), nullable=False),
        sa.Column("body_preview", sa.Text(), nullable=True),
        sa.Column("status", sa.Enum("PENDING", "SENT", "FAILED", name="emailstatus"), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("retries", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_email_logs_id"), "email_logs", ["id"], unique=False)
    op.create_index(op.f("ix_email_logs_recipient"), "email_logs", ["recipient"], unique=False)
    op.create_index(op.f("ix_email_logs_status"), "email_logs", ["status"], unique=False)
    op.create_index(op.f("ix_email_logs_created_at"), "email_logs", ["created_at"], unique=False)

    # 9. system_settings table
    op.create_table(
        "system_settings",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("key", sa.String(length=100), nullable=False),
        sa.Column("value", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_system_settings_id"), "system_settings", ["id"], unique=False)
    op.create_index(op.f("ix_system_settings_key"), "system_settings", ["key"], unique=True)


def downgrade() -> None:
    op.drop_table("system_settings")
    op.drop_table("email_logs")
    op.drop_table("inventory_movements")
    op.drop_table("order_approvals")
    op.drop_table("sales_order_items")
    op.drop_table("sales_orders")
    op.drop_table("products")
    op.drop_table("customers")
    op.drop_table("users")
    
    # Drop enums if on postgres (mysql ignores)
    for enum_name in ["emailstatus", "movementtype", "approvaldecision", "orderstatus", "userrole"]:
        sa.Enum(name=enum_name).drop(op.get_bind(), checkfirst=True)
