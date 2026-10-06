import enum
from typing import List, Union
from sqlalchemy import Column, Integer, String, Boolean, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, SoftDeleteMixin


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    SALES = "SALES"


ALL_SCREENS = ["dashboard", "orders", "products", "customers", "inventory", "approvals", "settings", "users"]
DEFAULT_SALES_SCREENS = ["dashboard", "orders", "products", "customers", "inventory"]


class User(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.SALES, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_super_admin = Column(Boolean, default=False, nullable=False)
    manager_id = Column(Integer, nullable=True)
    created_by_id = Column(Integer, nullable=True)
    _allowed_screens = Column("allowed_screens", String(500), nullable=True, default="dashboard,orders,products,customers,inventory")

    # Relationships
    orders_created = relationship("SalesOrder", back_populates="creator", foreign_keys="SalesOrder.creator_id")
    approvals_decided = relationship("OrderApproval", back_populates="approver", foreign_keys="OrderApproval.approver_id")

    @property
    def allowed_screens(self) -> List[str]:
        if self.is_super_admin:
            return ALL_SCREENS
        if not self._allowed_screens:
            return DEFAULT_SALES_SCREENS
        screens = [s.strip().lower() for s in self._allowed_screens.split(",") if s.strip()]
        return screens if screens else DEFAULT_SALES_SCREENS

    @allowed_screens.setter
    def allowed_screens(self, val: Union[List[str], str, None]):
        if isinstance(val, list):
            self._allowed_screens = ",".join(s.strip().lower() for s in val if s.strip())
        elif isinstance(val, str):
            self._allowed_screens = val.strip().lower()
        else:
            self._allowed_screens = ",".join(DEFAULT_SALES_SCREENS)

    def __repr__(self) -> str:
        return f"<User id={self.id} email='{self.email}' role='{self.role}' super={self.is_super_admin}>"
