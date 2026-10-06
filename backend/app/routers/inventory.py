import math
from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.inventory import MovementType
from app.repositories.inventory_repo import InventoryRepository
from app.services.inventory_service import InventoryService
from app.schemas.inventory import InventoryMovementResponse, LowStockAlertResponse
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/inventory", tags=["Inventory Ledger & Alerts"])


@router.get("/movements", response_model=PaginatedResponse[InventoryMovementResponse])
def list_inventory_movements(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    product_id: Optional[int] = None,
    movement_type: Optional[MovementType] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Query immutable stock movement ledger records."""
    repo = InventoryRepository(db)
    skip = (page - 1) * page_size
    items, total = repo.list_movements(
        skip=skip,
        limit=page_size,
        product_id=product_id,
        movement_type=movement_type,
        date_from=date_from,
        date_to=date_to,
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    responses = [
        InventoryMovementResponse(
            id=m.id,
            product_id=m.product_id,
            product_sku=m.product.sku if m.product else "UNKNOWN",
            product_name=m.product.name if m.product else "Unknown Product",
            movement_type=m.movement_type,
            quantity=m.quantity,
            balance_after=m.balance_after,
            reference_order_id=m.reference_order_id,
            reason=m.reason,
            created_at=m.created_at,
        )
        for m in items
    ]

    return PaginatedResponse(
        items=responses,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/movements/export/csv")
def export_inventory_movements_csv(
    product_id: Optional[int] = None,
    movement_type: Optional[MovementType] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export inventory movements ledger as a downloadable CSV report."""
    import csv
    import io
    from fastapi.responses import StreamingResponse

    repo = InventoryRepository(db)
    items, _ = repo.list_movements(
        skip=0,
        limit=10000,
        product_id=product_id,
        movement_type=movement_type,
        date_from=date_from,
        date_to=date_to,
    )
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Movement ID",
        "Date",
        "Product SKU",
        "Product Name",
        "Movement Type",
        "Quantity",
        "Balance After",
        "Reference Order ID",
        "Reason",
    ])
    for m in items:
        writer.writerow([
            m.id,
            m.created_at.strftime("%Y-%m-%d %H:%M:%S") if m.created_at else "",
            m.product.sku if m.product else "UNKNOWN",
            m.product.name if m.product else "Unknown Product",
            m.movement_type.value,
            m.quantity,
            m.balance_after,
            m.reference_order_id or "",
            m.reason or "",
        ])
    output.seek(0)
    filename = f"inventory_movements_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/low-stock", response_model=List[LowStockAlertResponse])
def get_low_stock_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all products whose stock levels are at or below their reorder threshold."""
    service = InventoryService(db)
    return service.get_low_stock_alerts()
