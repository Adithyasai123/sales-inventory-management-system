import enum
from typing import List, Union
from sqlalchemy import Column, Integer, String, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, SoftDeleteMixin


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    SALES = "SALES"
    WAREHOUSE = "WAREHOUSE"
    FINANCE = "FINANCE"


ALL_SCREENS = ["dashboard", "orders", "products", "customers", "inventory", "approvals", "settings", "users", "audit"]
DEFAULT_SALES_SCREENS = ["dashboard", "orders", "products", "customers", "inventory"]
DEFAULT_WAREHOUSE_SCREENS = ["dashboard", "orders", "products", "inventory"]
DEFAULT_FINANCE_SCREENS = ["dashboard", "orders", "customers", "inventory", "audit"]


class User(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(50), default="SALES", nullable=False, index=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="SET NULL"), nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_super_admin = Column(Boolean, default=False, nullable=False)
    manager_id = Column(Integer, nullable=True)
    created_by_id = Column(Integer, nullable=True)
    branch = Column(String(100), nullable=True, default="Hyderabad")
    _allowed_screens = Column("allowed_screens", String(500), nullable=True, default="dashboard,orders,products,customers,inventory")

    # Relationships
    role_rel = relationship("Role", back_populates="users", lazy="joined")
    orders_created = relationship("SalesOrder", back_populates="creator", foreign_keys="SalesOrder.creator_id")
    approvals_decided = relationship("OrderApproval", back_populates="approver", foreign_keys="OrderApproval.approver_id")

    def has_permission(self, perm_name: str) -> bool:
        """Check if user has a specific granular capability."""
        if self.is_super_admin or self.role in [UserRole.ADMIN, "ADMIN"]:
            return True
        if self.role_rel:
            return getattr(self.role_rel, perm_name, False)
        return False

    @property
    def allowed_screens(self) -> List[str]:
        if self.is_super_admin:
            return ALL_SCREENS
        if self._allowed_screens:
            screens = [s.strip().lower() for s in self._allowed_screens.split(",") if s.strip()]
            if screens:
                return screens
        if self.role_rel and self.role_rel.allowed_screens:
            return [s.strip().lower() for s in self.role_rel.allowed_screens.split(",") if s.strip()]
        return DEFAULT_SALES_SCREENS

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
