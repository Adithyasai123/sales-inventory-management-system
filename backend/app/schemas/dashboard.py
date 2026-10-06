from decimal import Decimal
from typing import List
from pydantic import BaseModel


class DashboardKPISummary(BaseModel):
    # 1. Total Sales Revenue
    total_sales_revenue: Decimal
    revenue_prev: Decimal = Decimal("0.00")
    revenue_delta: float = 0.0
    revenue_sparkline: List[float] = []

    # 2. Total Orders Count
    total_orders_count: int
    orders_prev: int = 0
    orders_delta: float = 0.0
    orders_sparkline: List[float] = []

    # 3. Average Order Value
    avg_order_value: Decimal = Decimal("0.00")
    avg_order_value_prev: Decimal = Decimal("0.00")
    avg_order_value_delta: float = 0.0
    avg_order_value_sparkline: List[float] = []

    # 4. Pending Approvals
    pending_approvals_count: int
    pending_approvals_prev: int = 0
    pending_approvals_delta: float = 0.0
    pending_approvals_sparkline: List[float] = []

    # 5. Low Stock Items
    low_stock_items_count: int
    low_stock_prev: int = 0
    low_stock_delta: float = 0.0
    low_stock_sparkline: List[float] = []

    # 6. Total Inventory Value
    inventory_value: Decimal = Decimal("0.00")
    inventory_value_prev: Decimal = Decimal("0.00")
    inventory_value_delta: float = 0.0
    inventory_value_sparkline: List[float] = []


class SalesTrendPoint(BaseModel):
    date: str
    revenue: Decimal
    previous_revenue: Decimal = Decimal("0.00")
    orders_count: int


class OrderStatusCount(BaseModel):
    status: str
    count: int


class TopSellingProduct(BaseModel):
    product_id: int
    sku: str
    name: str
    units_sold: int
    total_revenue: Decimal


class TopCustomer(BaseModel):
    customer_id: int
    customer_name: str
    orders_count: int
    total_revenue: Decimal


class InventoryHealthItem(BaseModel):
    product_id: int
    sku: str
    name: str
    stock_quantity: int
    reorder_level: int
    is_low_stock: bool
    unit_price: Decimal


class ApprovalStatsResponse(BaseModel):
    created_count: int
    pending_count: int
    approved_count: int
    rejected_count: int
    avg_decision_time_hours: float
    avg_decision_time_formatted: str


class MovementTrendPoint(BaseModel):
    date: str
    in_qty: int
    out_qty: int


class DashboardSummaryResponse(BaseModel):
    kpis: DashboardKPISummary
    sales_trend: List[SalesTrendPoint]
    status_distribution: List[OrderStatusCount]
    top_products: List[TopSellingProduct]
    range_days: int = 30
