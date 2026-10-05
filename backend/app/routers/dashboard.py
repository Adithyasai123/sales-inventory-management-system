from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.dashboard_service import DashboardService
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    TopCustomer,
    InventoryHealthItem,
    ApprovalStatsResponse,
    MovementTrendPoint,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard Analytics"])


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    range: int = Query(30, ge=1, le=365, description="Date range in days (7, 30, 90)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve aggregate KPI cards, sales trends with previous period comparison, status breakdown, and top-selling products."""
    service = DashboardService(db)
    return service.get_dashboard_summary(range_days=range)


@router.get("/top-customers", response_model=List[TopCustomer])
def get_top_customers(
    range: int = Query(30, ge=1, le=365, description="Date range in days (7, 30, 90)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve top 5 customers by completed order revenue within the given date range."""
    service = DashboardService(db)
    return service.get_top_customers(range_days=range, limit=5)


@router.get("/inventory-health", response_model=List[InventoryHealthItem])
def get_inventory_health(
    range: int = Query(30, ge=1, le=365, description="Date range in days (7, 30, 90)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve the lowest-stock products with stock vs reorder level comparisons."""
    service = DashboardService(db)
    return service.get_inventory_health(limit=8)


@router.get("/approval-stats", response_model=ApprovalStatsResponse)
def get_approval_stats(
    range: int = Query(30, ge=1, le=365, description="Date range in days (7, 30, 90)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve approval funnel counts (created, pending, approved, rejected) and average turnaround time."""
    service = DashboardService(db)
    return service.get_approval_stats(range_days=range)


@router.get("/movements-trend", response_model=List[MovementTrendPoint])
def get_movements_trend(
    range: int = Query(14, ge=1, le=365, description="Date range in days (7, 14, 30, 90)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve daily inventory movements breakdown (stacked IN vs OUT)."""
    service = DashboardService(db)
    return service.get_movements_trend(range_days=range)
