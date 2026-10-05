from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models.order import SalesOrder, SalesOrderItem, OrderStatus
from app.models.product import Product
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    DashboardKPISummary,
    SalesTrendPoint,
    OrderStatusCount,
    TopSellingProduct,
)


class DashboardService:
    def __init__(self, db: Session):
        self.db = db

    def get_dashboard_summary(self) -> DashboardSummaryResponse:
        # 1. Total Sales Revenue (COMPLETED orders)
        total_revenue_result = (
            self.db.query(func.coalesce(func.sum(SalesOrder.total_amount), 0))
            .filter(SalesOrder.status == OrderStatus.COMPLETED)
            .scalar()
        )
        total_sales_revenue = Decimal(str(total_revenue_result or 0)).quantize(Decimal("0.01"))

        # 2. Total Orders Count
        total_orders_count = self.db.query(func.count(SalesOrder.id)).scalar() or 0

        # 3. Pending Approvals Count
        pending_approvals_count = (
            self.db.query(func.count(SalesOrder.id))
            .filter(SalesOrder.status == OrderStatus.PENDING_APPROVAL)
            .scalar() or 0
        )

        # 4. Low Stock Items Count
        low_stock_items_count = (
            self.db.query(func.count(Product.id))
            .filter(
                Product.is_deleted == False,
                Product.is_active == True,
                Product.stock_quantity <= Product.reorder_level,
            )
            .scalar() or 0
        )

        kpis = DashboardKPISummary(
            total_sales_revenue=total_sales_revenue,
            total_orders_count=total_orders_count,
            pending_approvals_count=pending_approvals_count,
            low_stock_items_count=low_stock_items_count,
        )

        # 5. Sales Trend (Last 30 Days)
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        daily_sales_query = (
            self.db.query(
                func.date(SalesOrder.created_at).label("order_date"),
                func.coalesce(func.sum(SalesOrder.total_amount), 0).label("revenue"),
                func.count(SalesOrder.id).label("count"),
            )
            .filter(
                SalesOrder.status == OrderStatus.COMPLETED,
                SalesOrder.created_at >= thirty_days_ago,
            )
            .group_by(func.date(SalesOrder.created_at))
            .order_by(func.date(SalesOrder.created_at).asc())
            .all()
        )

        daily_sales_map = {
            str(row.order_date): {
                "revenue": Decimal(str(row.revenue)).quantize(Decimal("0.01")),
                "count": row.count,
            }
            for row in daily_sales_query
        }

        sales_trend: List[SalesTrendPoint] = []
        for i in range(30, -1, -1):
            day = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
            data = daily_sales_map.get(day, {"revenue": Decimal("0.00"), "count": 0})
            sales_trend.append(
                SalesTrendPoint(
                    date=day,
                    revenue=data["revenue"],
                    orders_count=data["count"],
                )
            )

        # 6. Status Breakdown
        status_results = (
            self.db.query(SalesOrder.status, func.count(SalesOrder.id))
            .group_by(SalesOrder.status)
            .all()
        )
        status_distribution = [
            OrderStatusCount(status=status.value, count=count)
            for status, count in status_results
        ]

        # 7. Top Selling Products
        top_products_query = (
            self.db.query(
                Product.id,
                Product.sku,
                Product.name,
                func.sum(SalesOrderItem.quantity).label("units_sold"),
                func.sum(SalesOrderItem.total_price).label("revenue"),
            )
            .join(SalesOrderItem, SalesOrderItem.product_id == Product.id)
            .join(SalesOrder, SalesOrderItem.order_id == SalesOrder.id)
            .filter(SalesOrder.status == OrderStatus.COMPLETED)
            .group_by(Product.id, Product.sku, Product.name)
            .order_by(desc("units_sold"))
            .limit(5)
            .all()
        )

        top_products = [
            TopSellingProduct(
                product_id=row.id,
                sku=row.sku,
                name=row.name,
                units_sold=int(row.units_sold or 0),
                total_revenue=Decimal(str(row.revenue or 0)).quantize(Decimal("0.01")),
            )
            for row in top_products_query
        ]

        return DashboardSummaryResponse(
            kpis=kpis,
            sales_trend=sales_trend,
            status_distribution=status_distribution,
            top_products=top_products,
        )
