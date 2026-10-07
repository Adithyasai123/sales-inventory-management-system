import math
import io
import csv
from datetime import datetime, timezone
from typing import Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import EntityNotFoundException, DuplicateResourceException
from app.dependencies import get_current_user, require_role
from app.models.product import Product
from app.models.inventory import MovementType
from app.models.user import User, UserRole
from app.repositories.base import handle_paginated_query
from app.repositories.product_repo import ProductRepository
from app.repositories.inventory_repo import InventoryRepository
from app.services.inventory_service import InventoryService
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, StockAdjustRequest
from app.schemas.common import PaginatedResponse, MessageResponse

router = APIRouter(prefix="/products", tags=["Products"])


def _map_product_response(item: Product) -> ProductResponse:
    p_resp = ProductResponse.model_validate(item)
    p_resp.reserved_quantity = getattr(item, "reserved_quantity", 0) or 0
    p_resp.available_stock = max(0, item.stock_quantity - p_resp.reserved_quantity)
    p_resp.is_low_stock = p_resp.available_stock <= item.reorder_level
    return p_resp


@router.get("", response_model=PaginatedResponse[ProductResponse])
def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    is_low_stock: Optional[bool] = None,
    is_active: Optional[bool] = None,
    include_deleted: bool = Query(False),
    sort_by: str = Query("name", pattern="^(name|sku|price|stock_quantity|created_at)$"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List products with catalog filtering, search, low-stock filter, and pagination."""
    repo = ProductRepository(db)
    return handle_paginated_query(
        repo.list_products,
        page=page,
        page_size=page_size,
        mapper=_map_product_response,
        search=search,
        category=category,
        is_low_stock=is_low_stock,
        is_active=is_active,
        include_deleted=include_deleted,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
):
    """Create a new product with initial stock and movement ledger record."""
    product_repo = ProductRepository(db)
    inventory_repo = InventoryRepository(db)

    if product_repo.get_by_sku(payload.sku):
        raise DuplicateResourceException("Product", "sku", payload.sku)

    product = Product(
        sku=payload.sku.upper().strip(),
        name=payload.name.strip(),
        description=payload.description.strip() if payload.description else None,
        category=payload.category.strip() if payload.category else None,
        price=payload.price,
        cost_price=payload.cost_price,
        stock_quantity=payload.stock_quantity,
        reserved_quantity=0,
        reorder_level=payload.reorder_level,
        is_active=True,
    )
    product_repo.create(product)

    # Initial inventory ledger record
    if payload.stock_quantity > 0:
        inventory_repo.record_movement(
            product_id=product.id,
            movement_type=MovementType.IN,
            quantity=payload.stock_quantity,
            balance_after=payload.stock_quantity,
            reason="Initial stock creation",
        )

    db.commit()
    db.refresh(product)
    
    return _map_product_response(product)


@router.get("/export/csv")
def export_products_csv(
    search: Optional[str] = None,
    category: Optional[str] = None,
    is_low_stock: Optional[bool] = None,
    is_active: Optional[bool] = None,
    include_deleted: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export product catalog as CSV."""
    repo = ProductRepository(db)
    items, _ = repo.list_products(
        skip=0,
        limit=10000,
        search=search,
        category=category,
        is_low_stock=is_low_stock,
        is_active=is_active,
        include_deleted=include_deleted,
        sort_by="name",
        sort_order="asc",
    )
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID",
        "SKU",
        "Name",
        "Category",
        "Price",
        "Cost Price",
        "Stock Quantity",
        "Reorder Level",
        "Is Active",
        "Is Deleted",
        "Created At",
    ])
    for p in items:
        writer.writerow([
            p.id,
            p.sku,
            p.name,
            p.category or "",
            str(p.price),
            str(p.cost_price) if p.cost_price is not None else "",
            p.stock_quantity,
            p.reorder_level,
            "Yes" if p.is_active else "No",
            "Yes" if getattr(p, "is_deleted", False) else "No",
            p.created_at.strftime("%Y-%m-%d %H:%M:%S") if p.created_at else "",
        ])
    output.seek(0)
    filename = f"products_export_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/{id}", response_model=ProductResponse)
def get_product(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch product details by ID."""
    repo = ProductRepository(db)
    product = repo.get_by_id(id)
    if not product:
        raise EntityNotFoundException("Product", id)
    
    return _map_product_response(product)


@router.put("/{id}", response_model=ProductResponse)
def update_product(
    id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
):
    """Update product metadata, pricing, or reorder levels."""
    repo = ProductRepository(db)
    product = repo.get_by_id(id)
    if not product:
        raise EntityNotFoundException("Product", id)

    if payload.sku and payload.sku.upper() != product.sku:
        if repo.get_by_sku(payload.sku):
            raise DuplicateResourceException("Product", "sku", payload.sku)
        product.sku = payload.sku.upper().strip()

    if payload.name:
        product.name = payload.name.strip()
    if payload.description is not None:
        product.description = payload.description.strip() if payload.description else None
    if payload.category is not None:
        product.category = payload.category.strip() if payload.category else None
    if payload.price is not None:
        product.price = payload.price
    if payload.cost_price is not None:
        product.cost_price = payload.cost_price
    if payload.reorder_level is not None:
        product.reorder_level = payload.reorder_level
    if payload.is_active is not None:
        product.is_active = payload.is_active

    db.commit()
    db.refresh(product)

    return _map_product_response(product)


@router.delete("/{id}", response_model=MessageResponse)
def delete_product(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
):
    """Soft-delete a product."""
    repo = ProductRepository(db)
    product = repo.get_by_id(id)
    if not product:
        raise EntityNotFoundException("Product", id)

    repo.delete(product, soft=True)
    db.commit()
    return MessageResponse(message=f"Product '{product.sku}' soft-deleted successfully.")


@router.post("/{id}/restore", response_model=ProductResponse)
def restore_product(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
):
    """Restore a soft-deleted product."""
    repo = ProductRepository(db)
    product = repo.get_by_id_including_deleted(id)
    if not product:
        raise EntityNotFoundException("Product", id)

    repo.restore(product)
    db.commit()
    db.refresh(product)
    return _map_product_response(product)


@router.post("/{id}/adjust-stock", response_model=ProductResponse)
def adjust_product_stock(
    id: int,
    payload: StockAdjustRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER, UserRole.WAREHOUSE)),
):
    """Manually adjust product stock levels with mandatory reason audit."""
    service = InventoryService(db)
    product = service.adjust_stock(id, payload)
    return _map_product_response(product)
