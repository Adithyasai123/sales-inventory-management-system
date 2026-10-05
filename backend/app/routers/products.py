import math
from typing import Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import EntityNotFoundException, DuplicateResourceException
from app.dependencies import get_current_user, require_role
from app.models.product import Product
from app.models.inventory import MovementType
from app.models.user import User, UserRole
from app.repositories.product_repo import ProductRepository
from app.repositories.inventory_repo import InventoryRepository
from app.services.inventory_service import InventoryService
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, StockAdjustRequest
from app.schemas.common import PaginatedResponse, MessageResponse

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=PaginatedResponse[ProductResponse])
def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    is_low_stock: Optional[bool] = None,
    is_active: Optional[bool] = None,
    sort_by: str = Query("name", regex="^(name|sku|price|stock_quantity|created_at)$"),
    sort_order: str = Query("asc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List products with catalog filtering, search, low-stock filter, and pagination."""
    repo = ProductRepository(db)
    skip = (page - 1) * page_size
    items, total = repo.list_products(
        skip=skip,
        limit=page_size,
        search=search,
        category=category,
        is_low_stock=is_low_stock,
        is_active=is_active,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    # Annotate is_low_stock on responses
    response_items = []
    for item in items:
        p_resp = ProductResponse.model_validate(item)
        p_resp.is_low_stock = item.stock_quantity <= item.reorder_level
        response_items.append(p_resp)

    return PaginatedResponse(
        items=response_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
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
    
    resp = ProductResponse.model_validate(product)
    resp.is_low_stock = product.stock_quantity <= product.reorder_level
    return resp


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
    
    resp = ProductResponse.model_validate(product)
    resp.is_low_stock = product.stock_quantity <= product.reorder_level
    return resp


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

    resp = ProductResponse.model_validate(product)
    resp.is_low_stock = product.stock_quantity <= product.reorder_level
    return resp


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


@router.post("/{id}/adjust-stock", response_model=ProductResponse)
def adjust_product_stock(
    id: int,
    payload: StockAdjustRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
):
    """Manually adjust product stock levels with mandatory reason audit."""
    service = InventoryService(db)
    product = service.adjust_stock(id, payload)
    resp = ProductResponse.model_validate(product)
    resp.is_low_stock = product.stock_quantity <= product.reorder_level
    return resp
