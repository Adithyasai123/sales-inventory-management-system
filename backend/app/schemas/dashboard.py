from decimal import Decimal
from typing import List
from pydantic import BaseModel


class DashboardKPISummary(BaseModel):
    total_sales_revenue: Decimal
    total_orders_count: int
    pending_approvals_count: int
    low_stock_items_count: int


class SalesTrendPoint(BaseModel):
    date: str
    revenue: Decimal
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


class DashboardSummaryResponse(BaseModel):
    kpis: DashboardKPISummary
    sales_trend: List[SalesTrendPoint]
    status_distribution: List[OrderStatusCount]
    top_products: List[TopSellingProduct]
