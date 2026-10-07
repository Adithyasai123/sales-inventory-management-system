from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import EntityNotFoundException, DuplicateResourceException, PermissionDeniedException, BadRequestException
from app.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.role import Role
from app.repositories.role_repo import RoleRepository
from app.schemas.role import RoleCreate, RoleUpdate, RoleResponse
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/roles", tags=["Dynamic Roles & RBAC"])


def _map_role_to_response(role: Role) -> RoleResponse:
    screens = [s.strip().lower() for s in role.allowed_screens.split(",") if s.strip()] if role.allowed_screens else []
    return RoleResponse(
        id=role.id,
        name=role.name,
        display_name=role.display_name,
        description=role.description,
        is_system=role.is_system,
        allowed_screens=screens,
        can_create_orders=role.can_create_orders,
        can_approve_orders=role.can_approve_orders,
        can_adjust_stock=role.can_adjust_stock,
        can_manage_products=role.can_manage_products,
        can_manage_customers=role.can_manage_customers,
        can_manage_users=role.can_manage_users,
        can_manage_settings=role.can_manage_settings,
        can_view_audit=role.can_view_audit,
        users_count=len(role.users) if role.users else 0,
        created_at=role.created_at,
        updated_at=role.updated_at,
    )


@router.get("", response_model=List[RoleResponse])
def list_roles(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all dynamic roles configured in the SQL database."""
    repo = RoleRepository(db)
    roles = repo.list_roles(search=search)
    return [_map_role_to_response(r) for r in roles]


@router.post("", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
def create_role(
    payload: RoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
):
    """Create a new custom dynamic role in the database."""
    repo = RoleRepository(db)
    clean_name = payload.name.strip().upper()
    if repo.get_by_name(clean_name):
        raise DuplicateResourceException("Role", "name", clean_name)

    screens_str = ",".join(s.strip().lower() for s in payload.allowed_screens if s.strip())

    role = Role(
        name=clean_name,
        display_name=payload.display_name.strip(),
        description=payload.description.strip() if payload.description else None,
        is_system=False,
        allowed_screens=screens_str if screens_str else "dashboard",
        can_create_orders=payload.can_create_orders,
        can_approve_orders=payload.can_approve_orders,
        can_adjust_stock=payload.can_adjust_stock,
        can_manage_products=payload.can_manage_products,
        can_manage_customers=payload.can_manage_customers,
        can_manage_users=payload.can_manage_users,
        can_manage_settings=payload.can_manage_settings,
        can_view_audit=payload.can_view_audit,
    )
    repo.create(role)
    db.commit()
    db.refresh(role)
    return _map_role_to_response(role)


@router.get("/{id}", response_model=RoleResponse)
def get_role(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch details of a specific role by ID."""
    repo = RoleRepository(db)
    role = repo.get_by_id(id)
    if not role:
        raise EntityNotFoundException("Role", id)
    return _map_role_to_response(role)


@router.put("/{id}", response_model=RoleResponse)
def update_role(
    id: int,
    payload: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
):
    """Update display name, description, capabilities, or screens of a dynamic role."""
    repo = RoleRepository(db)
    role = repo.get_by_id(id)
    if not role:
        raise EntityNotFoundException("Role", id)

    if payload.display_name is not None:
        role.display_name = payload.display_name.strip()
    if payload.description is not None:
        role.description = payload.description.strip() if payload.description else None
    if payload.allowed_screens is not None:
        role.allowed_screens = ",".join(s.strip().lower() for s in payload.allowed_screens if s.strip())
    if payload.can_create_orders is not None:
        role.can_create_orders = payload.can_create_orders
    if payload.can_approve_orders is not None:
        role.can_approve_orders = payload.can_approve_orders
    if payload.can_adjust_stock is not None:
        role.can_adjust_stock = payload.can_adjust_stock
    if payload.can_manage_products is not None:
        role.can_manage_products = payload.can_manage_products
    if payload.can_manage_customers is not None:
        role.can_manage_customers = payload.can_manage_customers
    if payload.can_manage_users is not None:
        role.can_manage_users = payload.can_manage_users
    if payload.can_manage_settings is not None:
        role.can_manage_settings = payload.can_manage_settings
    if payload.can_view_audit is not None:
        role.can_view_audit = payload.can_view_audit

    db.commit()
    db.refresh(role)
    return _map_role_to_response(role)


@router.delete("/{id}", response_model=MessageResponse)
def delete_role(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Delete a custom dynamic role (system roles cannot be deleted)."""
    repo = RoleRepository(db)
    role = repo.get_by_id(id)
    if not role:
        raise EntityNotFoundException("Role", id)

    if role.is_system:
        raise BadRequestException("System roles (ADMIN, MANAGER, etc.) cannot be deleted.")

    if role.users and len(role.users) > 0:
        raise BadRequestException(f"Cannot delete role '{role.name}' because {len(role.users)} users are currently assigned to it.")

    repo.delete(role)
    db.commit()
    return MessageResponse(message=f"Role '{role.name}' deleted successfully.")
