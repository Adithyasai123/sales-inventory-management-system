import math
from fastapi import APIRouter, Depends, Query, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import require_role
from app.models.user import User, UserRole
from app.repositories.order_repo import OrderRepository
from app.services.approval_service import ApprovalService
from app.schemas.approval import ApprovalActionRequest
from app.schemas.order import OrderResponse, OrderDetailResponse
from app.schemas.common import PaginatedResponse
from app.routers.orders import _map_order_to_response, _map_order_to_detail

router = APIRouter(
    prefix="/approvals",
    tags=["Order Approvals (Manager/Admin Only)"],
    dependencies=[Depends(require_role(UserRole.MANAGER, UserRole.ADMIN))],
)


@router.get("/pending", response_model=PaginatedResponse[OrderResponse])
def list_pending_approvals(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.MANAGER, UserRole.ADMIN)),
):
    """Retrieve orders currently pending manager review and sign-off."""
    repo = OrderRepository(db)
    skip = (page - 1) * page_size
    items, total = repo.get_pending_approvals(skip=skip, limit=page_size)
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return PaginatedResponse(
        items=[_map_order_to_response(o) for o in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("/{id}/action", response_model=OrderDetailResponse)
def submit_approval_action(
    id: int,
    payload: ApprovalActionRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.MANAGER, UserRole.ADMIN)),
):
    """
    Approve or reject a pending sales order.
    On approve: Locks rows with SELECT ... FOR UPDATE, re-validates stock, deducts inventory, writes ledger, and sets COMPLETED.
    On reject: Sets REJECTED and dispatches notification to order creator.
    """
    service = ApprovalService(db)
    order = service.process_approval(
        order_id=id,
        action=payload,
        approver=current_user,
        background_tasks=background_tasks,
    )
    return _map_order_to_detail(order)
