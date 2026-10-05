from typing import List
from decimal import Decimal
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import require_role
from app.models.user import User, UserRole
from app.repositories.setting_repo import SettingRepository
from app.schemas.setting import (
    SystemSettingResponse,
    SystemSettingUpdate,
    ApprovalThresholdUpdate,
)

router = APIRouter(
    prefix="/settings",
    tags=["System Settings (Admin/Manager)"],
    dependencies=[Depends(require_role(UserRole.ADMIN, UserRole.MANAGER))],
)


@router.get("", response_model=List[SystemSettingResponse])
def get_all_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
):
    """Retrieve all configurable system settings."""
    repo = SettingRepository(db)
    return repo.list_all()


@router.put("/threshold", response_model=SystemSettingResponse)
def update_approval_threshold(
    payload: ApprovalThresholdUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
):
    """Update order value threshold above which manager sign-off is required."""
    repo = SettingRepository(db)
    setting = repo.set_value(
        key="approval_threshold",
        value=str(payload.threshold.quantize(Decimal("0.01"))),
        description="Orders with total_amount exceeding this threshold require manager approval.",
    )
    db.commit()
    db.refresh(setting)
    return setting


@router.put("/{key}", response_model=SystemSettingResponse)
def update_setting_by_key(
    key: str,
    payload: SystemSettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
):
    """Update setting value by key."""
    repo = SettingRepository(db)
    setting = repo.set_value(key=key, value=payload.value)
    db.commit()
    db.refresh(setting)
    return setting
