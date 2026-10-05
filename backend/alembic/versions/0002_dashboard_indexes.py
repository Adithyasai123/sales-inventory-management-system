"""Add dashboard query performance indexes

Revision ID: 0002_dashboard_indexes
Revises: 0001_initial_schema
Create Date: 2026-10-05 15:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0002_dashboard_indexes"
down_revision: Union[str, None] = "0001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add indexes to optimize dashboard aggregations and range queries
    op.create_index(
        "ix_sales_orders_created_at",
        "sales_orders",
        ["created_at"],
        unique=False,
    )
    op.create_index(
        "idx_sales_orders_status_created",
        "sales_orders",
        ["status", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_inventory_movements_created_type",
        "inventory_movements",
        ["created_at", "movement_type"],
        unique=False,
    )
    op.create_index(
        "ix_order_approvals_decided_at",
        "order_approvals",
        ["decided_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_order_approvals_decided_at", table_name="order_approvals")
    op.drop_index("ix_inventory_movements_created_type", table_name="inventory_movements")
    op.drop_index("idx_sales_orders_status_created", table_name="sales_orders")
    op.drop_index("ix_sales_orders_created_at", table_name="sales_orders")
