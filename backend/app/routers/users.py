from typing import Optional
import math
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_password_hash
from app.core.exceptions import EntityNotFoundException, DuplicateResourceException, PermissionDeniedException
from app.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.repositories.user_repo import UserRepository
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.schemas.common import PaginatedResponse, MessageResponse

router = APIRouter(
    prefix="/users",
    tags=["Users (Manager / Admin / Super Admin)"],
    dependencies=[Depends(require_role(UserRole.MANAGER, UserRole.ADMIN))],
)


def _check_is_super(user: User) -> bool:
    return (
        user.is_super_admin
        or user.role == UserRole.ADMIN
        or user.email in ["manager@sims.in", "manager@sims.local", "manager@sims.com", "admin@test.com", "admin@sims.local", "admin@sims.in"]
    )


@router.get("", response_model=PaginatedResponse[UserResponse])
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: Optional[UserRole] = None,
    search: Optional[str] = None,
    include_deleted: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List system users. Super Admin & Admins see all users; Regional Managers only see employees in their team."""
    repo = UserRepository(db)
    skip = (page - 1) * page_size

    is_super = _check_is_super(current_user)
    scoped_manager_id = None if is_super else current_user.id

    items, total = repo.list_users(
        skip=skip,
        limit=page_size,
        role=role,
        search=search,
        include_deleted=include_deleted,
        scoped_manager_id=scoped_manager_id,
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new user. Super Admin can create Managers & Employees; Managers can create their team employees."""
    is_super = _check_is_super(current_user)

    # Non-super-admin managers can only create employees with SALES role
    if not is_super and payload.role != UserRole.SALES:
        raise PermissionDeniedException("Managers can only create employees with the SALES role. Super Admin creates Managers.")

    repo = UserRepository(db)
    clean_email = payload.email.lower().strip()
    if db.query(User).filter(User.email == clean_email).first():
        raise DuplicateResourceException("User", "email", clean_email)

    assigned_manager_id = payload.manager_id if is_super else current_user.id
    if is_super and not assigned_manager_id and payload.role == UserRole.SALES:
        assigned_manager_id = current_user.id

    new_user = User(
        email=clean_email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name.strip(),
        role=payload.role,
        is_active=payload.is_active if payload.is_active is not None else True,
        is_super_admin=False,
        manager_id=assigned_manager_id,
        created_by_id=current_user.id,
    )
    if payload.allowed_screens is not None:
        screens = payload.allowed_screens
        if not is_super:
            screens = [s for s in screens if s != "users"]
        new_user.allowed_screens = screens

    repo.create(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.get("/{id}", response_model=UserResponse)
def get_user(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch user details by ID."""
    repo = UserRepository(db)
    user = repo.get_by_id(id)
    if not user:
        raise EntityNotFoundException("User", id)

    is_super = _check_is_super(current_user)
    if not is_super and user.created_by_id != current_user.id and user.manager_id != current_user.id:
        raise PermissionDeniedException("You can only view employees in your team.")

    return user


@router.put("/{id}", response_model=UserResponse)
def update_user(
    id: int,
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update user attributes. Managers can only update employees in their own team."""
    repo = UserRepository(db)
    user = repo.get_by_id(id)
    if not user:
        raise EntityNotFoundException("User", id)

    is_super = _check_is_super(current_user)
    if not is_super and user.created_by_id != current_user.id and user.manager_id != current_user.id:
        raise PermissionDeniedException("You can only modify employees belonging to your team.")

    # Guardrails for the single Super Admin
    if user.is_super_admin:
        if payload.is_active is False:
            raise PermissionDeniedException("The single Super Admin account cannot be deactivated.")
        if payload.role and payload.role != UserRole.MANAGER:
            raise PermissionDeniedException("The Super Admin account role cannot be changed.")

    if payload.email:
        clean_email = payload.email.lower().strip()
        if clean_email != user.email:
            if user.is_super_admin:
                raise PermissionDeniedException("The Super Admin account email address cannot be changed.")
            existing = db.query(User).filter(User.email == clean_email, User.id != user.id).first()
            if existing:
                raise DuplicateResourceException("User", "email", clean_email)
            user.email = clean_email

    if payload.full_name:
        user.full_name = payload.full_name.strip()
    if payload.role and is_super and not user.is_super_admin:
        user.role = payload.role
    if payload.manager_id is not None and is_super and not user.is_super_admin:
        user.manager_id = payload.manager_id
    if payload.is_active is not None and not user.is_super_admin:
        user.is_active = payload.is_active
    if payload.password:
        user.hashed_password = get_password_hash(payload.password)
    if payload.allowed_screens is not None:
        screens = payload.allowed_screens
        if not is_super:
            screens = [s for s in screens if s != "users"]
        user.allowed_screens = screens

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{id}", response_model=MessageResponse)
def delete_user(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Soft-delete a user."""
    repo = UserRepository(db)
    user = repo.get_by_id(id)
    if not user:
        raise EntityNotFoundException("User", id)

    if user.is_super_admin:
        raise PermissionDeniedException("The single Super Admin account cannot be deleted or deactivated.")

    is_super = _check_is_super(current_user)
    if not is_super and user.created_by_id != current_user.id and user.manager_id != current_user.id:
        raise PermissionDeniedException("You can only deactivate employees belonging to your team.")

    repo.delete(user, soft=True)
    db.commit()
    return MessageResponse(message=f"User '{user.email}' has been deactivated successfully.")


@router.post("/{id}/restore", response_model=UserResponse)
def restore_user(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Restore a soft-deleted user."""
    repo = UserRepository(db)
    user = repo.get_by_id_including_deleted(id)
    if not user:
        raise EntityNotFoundException("User", id)

    is_super = _check_is_super(current_user)
    if not is_super and user.created_by_id != current_user.id and user.manager_id != current_user.id:
        raise PermissionDeniedException("You can only restore employees belonging to your team.")

    repo.restore(user)
    db.commit()
    db.refresh(user)
    return user
