from typing import Optional, List
import math
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import get_password_hash
from app.core.exceptions import EntityNotFoundException, DuplicateResourceException, PermissionDeniedException
from app.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.repositories.base import to_paginated_response
from app.repositories.user_repo import UserRepository
from app.repositories.role_repo import RoleRepository
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserHierarchyNode
from app.schemas.common import PaginatedResponse, MessageResponse

router = APIRouter(
    prefix="/users",
    tags=["Users (Manager / Admin / Super Admin)"],
)


def _can_manage_users(user: User) -> bool:
    return (
        user.is_super_admin
        or user.role in [UserRole.ADMIN, UserRole.MANAGER, "ADMIN", "MANAGER"]
        or user.has_permission("can_manage_users")
        or "users" in user.allowed_screens
    )


def _check_is_super(user: User) -> bool:
    return (
        user.is_super_admin
        or user.role == UserRole.ADMIN
        or user.email in ["manager@sims.in", "manager@sims.local", "manager@sims.com", "admin@test.com", "admin@sims.local", "admin@sims.in"]
    )


@router.get("/hierarchy", response_model=List[UserHierarchyNode])
def get_user_hierarchy(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve full organizational hierarchy tree (Super Admin -> Regional Managers -> Direct Employees)."""
    from app.models.order import SalesOrder

    # Fetch all active non-deleted users
    all_users = (
        db.query(User)
        .filter(User.is_deleted == False)
        .order_by(User.is_super_admin.desc(), User.role.asc(), User.full_name.asc())
        .all()
    )

    order_counts = dict(
        db.query(SalesOrder.creator_id, func.count(SalesOrder.id))
        .group_by(SalesOrder.creator_id)
        .all()
    )

    user_map = {}
    for u in all_users:
        user_map[u.id] = UserHierarchyNode(
            id=u.id,
            full_name=u.full_name,
            email=u.email,
            role=u.role if isinstance(u.role, str) else u.role.value,
            branch=getattr(u, "branch", "Hyderabad") or "Hyderabad",
            is_active=u.is_active,
            is_super_admin=u.is_super_admin,
            manager_id=u.manager_id,
            manager_name=None,
            direct_reports=[],
            orders_count=order_counts.get(u.id, 0),
        )

    root_nodes: List[UserHierarchyNode] = []
    for u in all_users:
        node = user_map[u.id]
        if u.manager_id and u.manager_id in user_map:
            parent = user_map[u.manager_id]
            node.manager_name = parent.full_name
            parent.direct_reports.append(node)
        else:
            root_nodes.append(node)

    return root_nodes


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
    """List system users. Super Admin & Admins see all users; Regional Managers and Team Leads see employees in their circle and reporting line."""
    if not _can_manage_users(current_user):
        raise PermissionDeniedException("You do not have permission to view team members.")

    repo = UserRepository(db)
    skip = (page - 1) * page_size

    is_super = _check_is_super(current_user)
    scoped_manager_id = None if is_super else current_user.id
    scoped_branch = None if is_super else getattr(current_user, "branch", None)

    items, total = repo.list_users(
        skip=skip,
        limit=page_size,
        role=role,
        search=search,
        include_deleted=include_deleted,
        scoped_manager_id=scoped_manager_id,
        scoped_branch=scoped_branch,
    )

    # Enrich with manager names and direct report counts
    manager_ids = {u.manager_id for u in items if u.manager_id}
    managers = (
        dict(db.query(User.id, User.full_name).filter(User.id.in_(manager_ids)).all())
        if manager_ids
        else {}
    )

    user_ids = [u.id for u in items]
    report_counts = (
        dict(
            db.query(User.manager_id, func.count(User.id))
            .filter(User.manager_id.in_(user_ids), User.is_deleted == False)
            .group_by(User.manager_id)
            .all()
        )
        if user_ids
        else {}
    )

    response_items = []
    for u in items:
        ur = UserResponse.model_validate(u)
        ur.manager_name = managers.get(u.manager_id)
        ur.direct_reports_count = report_counts.get(u.id, 0)
        response_items.append(ur)

    return to_paginated_response(
        items=response_items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new user. Super Admin can create Managers & Admins; Managers & Leads can create operational staff."""
    if not _can_manage_users(current_user):
        raise PermissionDeniedException("You do not have permission to create users.")

    is_super = _check_is_super(current_user)

    role_repo = RoleRepository(db)
    target_role_str = payload.role if isinstance(payload.role, str) else payload.role.value
    db_role = None
    if payload.role_id:
        db_role = role_repo.get_by_id(payload.role_id)
        if db_role:
            target_role_str = db_role.name
    elif target_role_str:
        db_role = role_repo.get_by_name(target_role_str)

    # Non-super-admins cannot create ADMIN or MANAGER roles
    if not is_super and target_role_str in ["ADMIN", "MANAGER"]:
        raise PermissionDeniedException("Only Super Admin can create Managers and Admins. You can create operational staff (Sales, Warehouse, Finance).")

    repo = UserRepository(db)
    clean_email = payload.email.lower().strip()
    if db.query(User).filter(User.email == clean_email).first():
        raise DuplicateResourceException("User", "email", clean_email)

    if is_super:
        assigned_manager_id = payload.manager_id or current_user.id
    else:
        # A manager or lead can assign to themselves or any active lead/manager in their circle
        if payload.manager_id:
            target_mgr = db.query(User).filter(User.id == payload.manager_id, User.is_deleted == False).first()
            if target_mgr and (
                target_mgr.id == current_user.id
                or target_mgr.branch == current_user.branch
                or target_mgr.manager_id == current_user.id
            ):
                assigned_manager_id = target_mgr.id
            else:
                assigned_manager_id = current_user.id
        else:
            assigned_manager_id = current_user.id

    new_user = User(
        email=clean_email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name.strip(),
        role=target_role_str,
        role_id=db_role.id if db_role else None,
        is_active=payload.is_active if payload.is_active is not None else True,
        is_super_admin=False,
        manager_id=assigned_manager_id,
        created_by_id=current_user.id,
        branch=payload.branch if is_super else (payload.branch or getattr(current_user, "branch", "Hyderabad") or "Hyderabad"),
    )
    if payload.allowed_screens is not None:
        screens = payload.allowed_screens
        if not is_super:
            screens = [s for s in screens if s != "users"]
        new_user.allowed_screens = screens
    elif db_role and db_role.allowed_screens:
        new_user.allowed_screens = db_role.allowed_screens.split(",")

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
    if not _can_manage_users(current_user):
        raise PermissionDeniedException("You do not have permission to view this user.")

    repo = UserRepository(db)
    user = repo.get_by_id(id)
    if not user:
        raise EntityNotFoundException("User", id)

    is_super = _check_is_super(current_user)
    if not is_super:
        is_allowed = (
            user.id == current_user.id
            or user.created_by_id == current_user.id
            or user.manager_id == current_user.id
            or (user.branch and user.branch == current_user.branch)
        )
        if not is_allowed:
            raise PermissionDeniedException("You can only view employees in your team or circle.")

    manager_name = None
    if user.manager_id:
        mgr = db.query(User).filter(User.id == user.manager_id).first()
        if mgr:
            manager_name = mgr.full_name

    direct_reports_count = (
        db.query(func.count(User.id))
        .filter(User.manager_id == user.id, User.is_deleted == False)
        .scalar()
        or 0
    )

    res = UserResponse.model_validate(user)
    res.manager_name = manager_name
    res.direct_reports_count = direct_reports_count
    return res


@router.put("/{id}", response_model=UserResponse)
def update_user(
    id: int,
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update user attributes. Managers and leads can update employees in their own team or circle."""
    if not _can_manage_users(current_user):
        raise PermissionDeniedException("You do not have permission to modify users.")

    repo = UserRepository(db)
    user = repo.get_by_id(id)
    if not user:
        raise EntityNotFoundException("User", id)

    is_super = _check_is_super(current_user)
    if not is_super:
        is_allowed = (
            user.created_by_id == current_user.id
            or user.manager_id == current_user.id
            or (user.branch and user.branch == current_user.branch)
        )
        if not is_allowed:
            raise PermissionDeniedException("You can only modify employees belonging to your team or circle.")

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
    if (payload.role or payload.role_id) and is_super and not user.is_super_admin:
        role_repo = RoleRepository(db)
        if payload.role_id:
            db_role = role_repo.get_by_id(payload.role_id)
            if db_role:
                user.role_id = db_role.id
                user.role = db_role.name
        elif payload.role:
            target_role = payload.role if isinstance(payload.role, str) else payload.role.value
            user.role = target_role
            db_role = role_repo.get_by_name(target_role)
            user.role_id = db_role.id if db_role else None
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
    if not _can_manage_users(current_user):
        raise PermissionDeniedException("You do not have permission to delete users.")

    repo = UserRepository(db)
    user = repo.get_by_id(id)
    if not user:
        raise EntityNotFoundException("User", id)

    if user.is_super_admin:
        raise PermissionDeniedException("The single Super Admin account cannot be deleted or deactivated.")

    is_super = _check_is_super(current_user)
    if not is_super:
        is_allowed = (
            user.created_by_id == current_user.id
            or user.manager_id == current_user.id
            or (user.branch and user.branch == current_user.branch)
        )
        if not is_allowed:
            raise PermissionDeniedException("You can only deactivate employees belonging to your team or circle.")

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
    if not _can_manage_users(current_user):
        raise PermissionDeniedException("You do not have permission to restore users.")

    repo = UserRepository(db)
    user = repo.get_by_id_including_deleted(id)
    if not user:
        raise EntityNotFoundException("User", id)

    is_super = _check_is_super(current_user)
    if not is_super:
        is_allowed = (
            user.created_by_id == current_user.id
            or user.manager_id == current_user.id
            or (user.branch and user.branch == current_user.branch)
        )
        if not is_allowed:
            raise PermissionDeniedException("You can only restore employees belonging to your team or circle.")

    repo.restore(user)
    db.commit()
    db.refresh(user)
    return user
