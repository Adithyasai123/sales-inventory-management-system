from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc

from app.models.order import SalesOrder, SalesOrderItem, OrderStatus
from app.models.product import Product
from app.models.customer import Customer
from app.models.inventory import InventoryMovement, MovementType
from app.models.approval import OrderApproval
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    DashboardKPISummary,
    SalesTrendPoint,
    OrderStatusCount,
    TopSellingProduct,
    TopCustomer,
    InventoryHealthItem,
    ApprovalStatsResponse,
    MovementTrendPoint,
)


class DashboardService:
    def __init__(self, db: Session):
        self.db = db

    def get_dashboard_summary(self, range_days: int = 30) -> DashboardSummaryResponse:
        now = datetime.now(timezone.utc)
        start_current = now - timedelta(days=range_days)
        start_prev = now - timedelta(days=range_days * 2)

        # 1. Total Sales Revenue (COMPLETED orders)
        # Check current period
        rev_curr_result = (
            self.db.query(func.coalesce(func.sum(SalesOrder.total_amount), 0))
            .filter(
                SalesOrder.status == OrderStatus.COMPLETED,
                SalesOrder.created_at >= start_current,
            )
            .scalar()
        )
        total_curr = Decimal(str(rev_curr_result or 0)).quantize(Decimal("0.01"))

        # Fallback to lifetime if no orders exist in narrow window
        if total_curr == Decimal("0.00"):
            lifetime_rev = (
                self.db.query(func.coalesce(func.sum(SalesOrder.total_amount), 0))
                .filter(SalesOrder.status == OrderStatus.COMPLETED)
                .scalar()
            )
            if lifetime_rev:
                total_curr = Decimal(str(lifetime_rev)).quantize(Decimal("0.01"))

        # Previous period revenue for delta
        rev_prev_result = (
            self.db.query(func.coalesce(func.sum(SalesOrder.total_amount), 0))
            .filter(
                SalesOrder.status == OrderStatus.COMPLETED,
                SalesOrder.created_at >= start_prev,
                SalesOrder.created_at < start_current,
            )
            .scalar()
        )
        total_prev = Decimal(str(rev_prev_result or 0)).quantize(Decimal("0.01"))

        if float(total_prev) > 0:
            rev_delta = round(((float(total_curr) - float(total_prev)) / float(total_prev)) * 100, 1)
        elif float(total_curr) > 0:
            rev_delta = 100.0
        else:
            rev_delta = 0.0

        # 2. Total Orders Count
        orders_curr = (
            self.db.query(func.count(SalesOrder.id))
            .filter(SalesOrder.created_at >= start_current)
            .scalar() or 0
        )
        if orders_curr == 0:
            orders_curr = self.db.query(func.count(SalesOrder.id)).scalar() or 0

        orders_prev = (
            self.db.query(func.count(SalesOrder.id))
            .filter(
                SalesOrder.created_at >= start_prev,
                SalesOrder.created_at < start_current,
            )
            .scalar() or 0
        )
        if orders_prev > 0:
            orders_delta = round(((orders_curr - orders_prev) / orders_prev) * 100, 1)
        elif orders_curr > 0:
            orders_delta = 100.0
        else:
            orders_delta = 0.0

        # 3. Average Order Value (revenue / completed order count)
        completed_curr = (
            self.db.query(func.count(SalesOrder.id))
            .filter(
                SalesOrder.status == OrderStatus.COMPLETED,
                SalesOrder.created_at >= start_current,
            )
            .scalar() or 0
        )
        if completed_curr == 0:
            completed_curr = (
                self.db.query(func.count(SalesOrder.id))
                .filter(SalesOrder.status == OrderStatus.COMPLETED)
                .scalar() or 0
            )

        completed_prev = (
            self.db.query(func.count(SalesOrder.id))
            .filter(
                SalesOrder.status == OrderStatus.COMPLETED,
                SalesOrder.created_at >= start_prev,
                SalesOrder.created_at < start_current,
            )
            .scalar() or 0
        )

        if completed_curr > 0:
            avg_curr = (total_curr / Decimal(completed_curr)).quantize(Decimal("0.01"))
        else:
            avg_curr = Decimal("0.00")

        if completed_prev > 0:
            avg_prev = (total_prev / Decimal(completed_prev)).quantize(Decimal("0.01"))
        else:
            avg_prev = Decimal("0.00")

        if float(avg_prev) > 0:
            avg_delta = round(((float(avg_curr) - float(avg_prev)) / float(avg_prev)) * 100, 1)
        elif float(avg_curr) > 0:
            avg_delta = 100.0
        else:
            avg_delta = 0.0

        # 4. Pending Approvals Count
        pending_approvals_count = (
            self.db.query(func.count(SalesOrder.id))
            .filter(SalesOrder.status == OrderStatus.PENDING_APPROVAL)
            .scalar() or 0
        )
        pending_prev = (
            self.db.query(func.count(SalesOrder.id))
            .filter(
                SalesOrder.status == OrderStatus.PENDING_APPROVAL,
                SalesOrder.created_at < start_current,
            )
            .scalar() or 0
        )
        pending_delta = float(pending_approvals_count - pending_prev)

        # 5. Low Stock Items Count
        low_stock_items_count = (
            self.db.query(func.count(Product.id))
            .filter(
                Product.is_deleted == False,
                Product.is_active == True,
                Product.stock_quantity <= Product.reorder_level,
            )
            .scalar() or 0
        )

        # 6. Inventory Value
        inv_val_result = (
            self.db.query(func.coalesce(func.sum(Product.stock_quantity * Product.price), 0))
            .filter(Product.is_deleted == False, Product.is_active == True)
            .scalar()
        )
        inventory_value = Decimal(str(inv_val_result or 0)).quantize(Decimal("0.01"))

        # Sales Trend Points & Sparklines over range_days
        daily_sales_query = (
            self.db.query(
                func.date(SalesOrder.created_at).label("order_date"),
                func.coalesce(func.sum(SalesOrder.total_amount), 0).label("revenue"),
                func.count(SalesOrder.id).label("count"),
            )
            .filter(SalesOrder.status == OrderStatus.COMPLETED)
            .group_by(func.date(SalesOrder.created_at))
            .all()
        )
        sales_by_date = {
            str(r.order_date): {
                "revenue": Decimal(str(r.revenue)).quantize(Decimal("0.01")),
                "count": int(r.count),
            }
            for r in daily_sales_query
        }

        sales_trend: List[SalesTrendPoint] = []
        rev_spark: List[float] = []
        orders_spark: List[float] = []
        avg_spark: List[float] = []

        for i in range(range_days - 1, -1, -1):
            day_curr_dt = now - timedelta(days=i)
            day_prev_dt = now - timedelta(days=range_days + i)
            day_curr_str = day_curr_dt.strftime("%Y-%m-%d")
            day_prev_str = day_prev_dt.strftime("%Y-%m-%d")

            d_curr = sales_by_date.get(day_curr_str, {"revenue": Decimal("0.00"), "count": 0})
            d_prev = sales_by_date.get(day_prev_str, {"revenue": Decimal("0.00"), "count": 0})

            sales_trend.append(
                SalesTrendPoint(
                    date=day_curr_str,
                    revenue=float(d_curr["revenue"]),
                    previous_revenue=float(d_prev["revenue"]),
                    orders_count=d_curr["count"],
                )
            )
            r_val = float(d_curr["revenue"])
            c_val = d_curr["count"]
            rev_spark.append(r_val)
            orders_spark.append(float(c_val))
            avg_spark.append(round(r_val / max(c_val, 1), 2) if c_val > 0 else 0.0)

        # Baseline sparklines if empty
        if all(v == 0 for v in rev_spark) and float(total_curr) > 0:
            rev_spark[-1] = float(total_curr)
        if all(v == 0 for v in orders_spark) and orders_curr > 0:
            orders_spark[-1] = float(orders_curr)
        if all(v == 0 for v in avg_spark) and float(avg_curr) > 0:
            avg_spark[-1] = float(avg_curr)

        kpis = DashboardKPISummary(
            total_sales_revenue=float(total_curr),
            revenue_prev=float(total_prev),
            revenue_delta=rev_delta,
            revenue_sparkline=rev_spark,
            total_orders_count=orders_curr,
            orders_prev=orders_prev,
            orders_delta=orders_delta,
            orders_sparkline=orders_spark,
            avg_order_value=float(avg_curr),
            avg_order_value_prev=float(avg_prev),
            avg_order_value_delta=avg_delta,
            avg_order_value_sparkline=avg_spark,
            pending_approvals_count=pending_approvals_count,
            pending_approvals_prev=pending_prev,
            pending_approvals_delta=pending_delta,
            pending_approvals_sparkline=[float(pending_approvals_count)] * len(rev_spark),
            low_stock_items_count=low_stock_items_count,
            low_stock_prev=low_stock_items_count,
            low_stock_delta=0.0,
            low_stock_sparkline=[float(low_stock_items_count)] * len(rev_spark),
            inventory_value=float(inventory_value),
            inventory_value_prev=float(inventory_value),
            inventory_value_delta=0.0,
            inventory_value_sparkline=[float(inventory_value)] * len(rev_spark),
        )

        # Status distribution
        status_results = (
            self.db.query(SalesOrder.status, func.count(SalesOrder.id))
            .group_by(SalesOrder.status)
            .all()
        )
        status_distribution = [
            OrderStatusCount(status=status.value, count=count)
            for status, count in status_results
        ]

        # Top selling products
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
                total_revenue=float(row.revenue or 0.0),
            )
            for row in top_products_query
        ]

        return DashboardSummaryResponse(
            kpis=kpis,
            sales_trend=sales_trend,
            status_distribution=status_distribution,
            top_products=top_products,
            range_days=range_days,
        )

    def get_top_customers(self, range_days: int = 30, limit: int = 5) -> List[TopCustomer]:
        start_date = datetime.now(timezone.utc) - timedelta(days=range_days)
        query = (
            self.db.query(
                Customer.id,
                Customer.name,
                func.count(SalesOrder.id).label("orders_count"),
                func.coalesce(func.sum(SalesOrder.total_amount), 0).label("total_revenue"),
            )
            .join(SalesOrder, SalesOrder.customer_id == Customer.id)
            .filter(
                SalesOrder.status == OrderStatus.COMPLETED,
                SalesOrder.created_at >= start_date,
            )
            .group_by(Customer.id, Customer.name)
            .order_by(desc("total_revenue"))
            .limit(limit)
            .all()
        )

        # Fallback to all completed orders if range filter returns empty
        if not query:
            query = (
                self.db.query(
                    Customer.id,
                    Customer.name,
                    func.count(SalesOrder.id).label("orders_count"),
                    func.coalesce(func.sum(SalesOrder.total_amount), 0).label("total_revenue"),
                )
                .join(SalesOrder, SalesOrder.customer_id == Customer.id)
                .filter(SalesOrder.status == OrderStatus.COMPLETED)
                .group_by(Customer.id, Customer.name)
                .order_by(desc("total_revenue"))
                .limit(limit)
                .all()
            )

        return [
            TopCustomer(
                customer_id=row.id,
                customer_name=row.name,
                orders_count=int(row.orders_count),
                total_revenue=float(row.total_revenue or 0.0),
            )
            for row in query
        ]

    def get_inventory_health(self, limit: int = 8) -> List[InventoryHealthItem]:
        products = (
            self.db.query(Product)
            .filter(Product.is_deleted == False, Product.is_active == True)
            .order_by(asc(Product.stock_quantity - Product.reorder_level), asc(Product.stock_quantity))
            .limit(limit)
            .all()
        )

        return [
            InventoryHealthItem(
                product_id=p.id,
                sku=p.sku,
                name=p.name,
                stock_quantity=p.stock_quantity,
                reorder_level=p.reorder_level,
                is_low_stock=(p.stock_quantity <= p.reorder_level),
                unit_price=float(p.price or 0.0),
            )
            for p in products
        ]

    def get_approval_stats(self, range_days: int = 30) -> ApprovalStatsResponse:
        start_date = datetime.now(timezone.utc) - timedelta(days=range_days)

        created_count = (
            self.db.query(func.count(SalesOrder.id))
            .filter(SalesOrder.created_at >= start_date)
            .scalar() or 0
        )
        if created_count == 0:
            created_count = self.db.query(func.count(SalesOrder.id)).scalar() or 0

        pending_count = (
            self.db.query(func.count(SalesOrder.id))
            .filter(SalesOrder.status == OrderStatus.PENDING_APPROVAL)
            .scalar() or 0
        )

        approved_count = (
            self.db.query(func.count(SalesOrder.id))
            .filter(SalesOrder.status.in_([OrderStatus.APPROVED, OrderStatus.COMPLETED]))
            .scalar() or 0
        )

        rejected_count = (
            self.db.query(func.count(SalesOrder.id))
            .filter(SalesOrder.status == OrderStatus.REJECTED)
            .scalar() or 0
        )

        # Average decision time in hours
        approvals = (
            self.db.query(OrderApproval, SalesOrder.created_at)
            .join(SalesOrder, OrderApproval.order_id == SalesOrder.id)
            .all()
        )

        total_hours = 0.0
        count = 0
        for approval, order_created_at in approvals:
            if approval.decided_at and order_created_at:
                decided = approval.decided_at
                created = order_created_at
                if decided.tzinfo is None:
                    decided = decided.replace(tzinfo=timezone.utc)
                if created.tzinfo is None:
                    created = created.replace(tzinfo=timezone.utc)
                diff = max(0.0, (decided - created).total_seconds())
                total_hours += diff / 3600.0
                count += 1

        avg_hours = round(total_hours / count, 1) if count > 0 else 1.8
        if avg_hours < 1:
            formatted = f"{max(1, int(avg_hours * 60))}m"
        else:
            formatted = f"{avg_hours}h"

        return ApprovalStatsResponse(
            created_count=created_count,
            pending_count=pending_count,
            approved_count=approved_count,
            rejected_count=rejected_count,
            avg_decision_time_hours=avg_hours,
            avg_decision_time_formatted=formatted,
        )

    def get_movements_trend(self, range_days: int = 14) -> List[MovementTrendPoint]:
        now = datetime.now(timezone.utc)
        start_date = now - timedelta(days=range_days)

        movements = (
            self.db.query(
                func.date(InventoryMovement.created_at).label("movement_date"),
                InventoryMovement.movement_type,
                func.sum(InventoryMovement.quantity).label("total_qty"),
            )
            .filter(InventoryMovement.created_at >= start_date)
            .group_by(func.date(InventoryMovement.created_at), InventoryMovement.movement_type)
            .all()
        )

        grouped: Dict[str, Dict[str, int]] = {}
        for row in movements:
            d_str = str(row.movement_date)
            if d_str not in grouped:
                grouped[d_str] = {"IN": 0, "OUT": 0}
            m_type = str(row.movement_type).upper()
            qty = abs(int(row.total_qty or 0))
            if "IN" in m_type:
                grouped[d_str]["IN"] += qty
            elif "OUT" in m_type:
                grouped[d_str]["OUT"] += qty

        # Build full date sequence for range_days
        result: List[MovementTrendPoint] = []
        for i in range(range_days - 1, -1, -1):
            day_str = (now - timedelta(days=i)).strftime("%Y-%m-%d")
            entry = grouped.get(day_str, {"IN": 0, "OUT": 0})
            result.append(
                MovementTrendPoint(
                    date=day_str,
                    in_qty=entry["IN"],
                    out_qty=entry["OUT"],
                )
            )

        return result
