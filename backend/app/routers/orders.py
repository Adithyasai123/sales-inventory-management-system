import math
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, BackgroundTasks, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import EntityNotFoundException
from app.dependencies import get_current_user
from app.models.user import User
from app.models.order import OrderStatus
from app.repositories.order_repo import OrderRepository
from app.services.order_service import OrderService
from app.schemas.order import (
    OrderCreate,
    OrderResponse,
    OrderDetailResponse,
    OrderItemResponse,
)
from app.schemas.customer import CustomerResponse
from app.schemas.approval import ApprovalHistoryResponse
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/orders", tags=["Sales Orders"])


def _map_order_to_response(order) -> OrderResponse:
    return OrderResponse(
        id=order.id,
        order_number=order.order_number,
        customer_id=order.customer_id,
        customer_name=order.customer.name if order.customer else "Unknown",
        creator_id=order.creator_id,
        creator_name=order.creator.full_name if order.creator else "Unknown",
        status=order.status,
        subtotal=order.subtotal,
        tax_rate=order.tax_rate,
        tax_amount=order.tax_amount,
        total_amount=order.total_amount,
        requires_approval=order.requires_approval,
        notes=order.notes,
        items_count=len(order.items) if order.items else 0,
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


def _map_order_to_detail(order) -> OrderDetailResponse:
    base = _map_order_to_response(order)
    
    items = [
        OrderItemResponse(
            id=item.id,
            order_id=item.order_id,
            product_id=item.product_id,
            product_sku=item.product.sku if item.product else "UNKNOWN",
            product_name=item.product.name if item.product else "Unknown Product",
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=item.total_price,
        )
        for item in order.items
    ]

    approvals = [
        ApprovalHistoryResponse(
            id=appr.id,
            order_id=appr.order_id,
            approver_id=appr.approver_id,
            approver_name=appr.approver.full_name if appr.approver else "System",
            approver_email=appr.approver.email if appr.approver else "system@sims.local",
            decision=appr.decision,
            comment=appr.comment,
            decided_at=appr.decided_at,
        )
        for appr in order.approvals
    ]

    customer_resp = CustomerResponse.model_validate(order.customer)

    return OrderDetailResponse(
        **base.model_dump(),
        customer=customer_resp,
        items=items,
        approvals=approvals,
    )


@router.post("", response_model=OrderDetailResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new sales order with atomic stock validation and approval threshold check."""
    service = OrderService(db)
    order = service.create_order(payload, creator=current_user, background_tasks=background_tasks)
    return _map_order_to_detail(order)


@router.get("", response_model=PaginatedResponse[OrderResponse])
def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[OrderStatus] = None,
    customer_id: Optional[int] = None,
    creator_id: Optional[int] = None,
    search: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    sort_by: str = Query("created_at", pattern="^(created_at|order_number|total_amount)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List orders with filtering, search, status pills, and pagination."""
    repo = OrderRepository(db)
    skip = (page - 1) * page_size
    items, total = repo.list_orders(
        skip=skip,
        limit=page_size,
        status=status,
        customer_id=customer_id,
        creator_id=creator_id,
        search=search,
        date_from=date_from,
        date_to=date_to,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return PaginatedResponse(
        items=[_map_order_to_response(o) for o in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/export/csv")
def export_orders_csv(
    status: Optional[OrderStatus] = None,
    customer_id: Optional[int] = None,
    search: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export filtered sales orders as a downloadable CSV report."""
    import csv
    import io
    from fastapi.responses import StreamingResponse

    repo = OrderRepository(db)
    items, _ = repo.list_orders(
        skip=0,
        limit=5000,
        status=status,
        customer_id=customer_id,
        search=search,
        date_from=date_from,
        date_to=date_to,
        sort_by="created_at",
        sort_order="desc",
    )
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Order Number",
        "Customer",
        "Creator",
        "Status",
        "Subtotal",
        "Tax Amount",
        "Total Amount",
        "Requires Approval",
        "Created At",
    ])
    for o in items:
        writer.writerow([
            o.order_number,
            o.customer.name if o.customer else "N/A",
            o.creator.full_name if o.creator else "N/A",
            o.status.value,
            str(o.subtotal),
            str(o.tax_amount),
            str(o.total_amount),
            "Yes" if o.requires_approval else "No",
            o.created_at.strftime("%Y-%m-%d %H:%M:%S") if o.created_at else "",
        ])
    output.seek(0)
    filename = f"orders_export_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/{id}", response_model=OrderDetailResponse)
def get_order_detail(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve full order details including line items, customer, and approval history."""
    repo = OrderRepository(db)
    order = repo.get_with_details(id)
    if not order:
        raise EntityNotFoundException("SalesOrder", id)
    return _map_order_to_detail(order)


@router.post("/{id}/cancel", response_model=OrderDetailResponse)
def cancel_order(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel a pending or draft order."""
    service = OrderService(db)
    order = service.cancel_order(id, current_user)
    return _map_order_to_detail(order)
