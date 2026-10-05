from typing import Optional
import math
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_password_hash
from app.core.exceptions import EntityNotFoundException, DuplicateResourceException
from app.dependencies import require_role
from app.models.user import User, UserRole
from app.repositories.user_repo import UserRepository
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.schemas.common import PaginatedResponse, MessageResponse

router = APIRouter(
    prefix="/users",
    tags=["Users (Admin Only)"],
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)


@router.get("", response_model=PaginatedResponse[UserResponse])
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: Optional[UserRole] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List system users with pagination, role filtering, and search."""
    repo = UserRepository(db)
    skip = (page - 1) * page_size
    items, total = repo.list_users(skip=skip, limit=page_size, role=role, search=search)
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    """Create a new system user with assigned role."""
    repo = UserRepository(db)
    if repo.get_by_email(payload.email):
        raise DuplicateResourceException("User", "email", payload.email)

    new_user = User(
        email=payload.email.lower().strip(),
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name.strip(),
        role=payload.role,
        is_active=True,
    )
    repo.create(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.get("/{id}", response_model=UserResponse)
def get_user(id: int, db: Session = Depends(get_db)):
    """Fetch user details by ID."""
    repo = UserRepository(db)
    user = repo.get_by_id(id)
    if not user:
        raise EntityNotFoundException("User", id)
    return user


@router.put("/{id}", response_model=UserResponse)
def update_user(id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    """Update user attributes or reset password."""
    repo = UserRepository(db)
    user = repo.get_by_id(id)
    if not user:
        raise EntityNotFoundException("User", id)

    if payload.email and payload.email.lower() != user.email:
        existing = repo.get_by_email(payload.email)
        if existing:
            raise DuplicateResourceException("User", "email", payload.email)
        user.email = payload.email.lower().strip()

    if payload.full_name:
        user.full_name = payload.full_name.strip()
    if payload.role:
        user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.password:
        user.hashed_password = get_password_hash(payload.password)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{id}", response_model=MessageResponse)
def delete_user(id: int, db: Session = Depends(get_db)):
    """Soft-delete a user."""
    repo = UserRepository(db)
    user = repo.get_by_id(id)
    if not user:
        raise EntityNotFoundException("User", id)

    repo.delete(user, soft=True)
    db.commit()
    return MessageResponse(message=f"User '{user.email}' has been deactivated successfully.")
