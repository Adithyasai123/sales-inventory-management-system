import math
import io
import csv
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import EntityNotFoundException, DuplicateResourceException
from app.dependencies import get_current_user, require_role
from app.models.customer import Customer
from app.models.user import User, UserRole
from app.repositories.base import handle_paginated_query
from app.repositories.customer_repo import CustomerRepository
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.schemas.common import PaginatedResponse, MessageResponse

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("", response_model=PaginatedResponse[CustomerResponse])
def list_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    include_deleted: bool = Query(False),
    sort_by: str = Query("name", pattern="^(name|email|company|created_at)$"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List customers with search, pagination, and sorting."""
    repo = CustomerRepository(db)
    return handle_paginated_query(
        repo.list_customers,
        page=page,
        page_size=page_size,
        search=search,
        is_active=is_active,
        include_deleted=include_deleted,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Register a new customer."""
    repo = CustomerRepository(db)
    if repo.get_by_email(payload.email):
        raise DuplicateResourceException("Customer", "email", payload.email)

    customer = Customer(
        name=payload.name.strip(),
        email=payload.email.lower().strip(),
        phone=payload.phone.strip() if payload.phone else None,
        company=payload.company.strip() if payload.company else None,
        address=payload.address.strip() if payload.address else None,
        city=payload.city.strip() if payload.city else None,
        country=payload.country.strip() if payload.country else None,
        is_active=True,
    )
    repo.create(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/export/csv")
def export_customers_csv(
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    include_deleted: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export customer list as CSV."""
    repo = CustomerRepository(db)
    items, _ = repo.list_customers(
        skip=0,
        limit=10000,
        search=search,
        is_active=is_active,
        include_deleted=include_deleted,
        sort_by="name",
        sort_order="asc",
    )
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID",
        "Name",
        "Email",
        "Phone",
        "Company",
        "Address",
        "City",
        "Country",
        "Is Active",
        "Is Deleted",
        "Created At",
    ])
    for c in items:
        writer.writerow([
            c.id,
            c.name,
            c.email,
            c.phone or "",
            c.company or "",
            c.address or "",
            c.city or "",
            c.country or "",
            "Yes" if c.is_active else "No",
            "Yes" if getattr(c, "is_deleted", False) else "No",
            c.created_at.strftime("%Y-%m-%d %H:%M:%S") if c.created_at else "",
        ])
    output.seek(0)
    filename = f"customers_export_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/{id}", response_model=CustomerResponse)
def get_customer(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve customer details by ID."""
    repo = CustomerRepository(db)
    customer = repo.get_by_id(id)
    if not customer:
        raise EntityNotFoundException("Customer", id)
    return customer


@router.put("/{id}", response_model=CustomerResponse)
def update_customer(
    id: int,
    payload: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update customer details."""
    repo = CustomerRepository(db)
    customer = repo.get_by_id(id)
    if not customer:
        raise EntityNotFoundException("Customer", id)

    if payload.email and payload.email.lower() != customer.email:
        if repo.get_by_email(payload.email):
            raise DuplicateResourceException("Customer", "email", payload.email)
        customer.email = payload.email.lower().strip()

    if payload.name:
        customer.name = payload.name.strip()
    if payload.phone is not None:
        customer.phone = payload.phone.strip() if payload.phone else None
    if payload.company is not None:
        customer.company = payload.company.strip() if payload.company else None
    if payload.address is not None:
        customer.address = payload.address.strip() if payload.address else None
    if payload.city is not None:
        customer.city = payload.city.strip() if payload.city else None
    if payload.country is not None:
        customer.country = payload.country.strip() if payload.country else None
    if payload.is_active is not None:
        customer.is_active = payload.is_active

    db.commit()
    db.refresh(customer)
    return customer


@router.delete("/{id}", response_model=MessageResponse)
def delete_customer(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft-delete a customer."""
    repo = CustomerRepository(db)
    customer = repo.get_by_id(id)
    if not customer:
        raise EntityNotFoundException("Customer", id)

    repo.delete(customer, soft=True)
    db.commit()
    return MessageResponse(message=f"Customer '{customer.name}' has been soft-deleted.")


@router.post("/{id}/restore", response_model=CustomerResponse)
def restore_customer(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
):
    """Restore a soft-deleted customer."""
    repo = CustomerRepository(db)
    customer = repo.get_by_id_including_deleted(id)
    if not customer:
        raise EntityNotFoundException("Customer", id)

    repo.restore(customer)
    db.commit()
    db.refresh(customer)
    return customer
