from typing import List
from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class Role(Base, TimestampMixin):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(50), unique=True, index=True, nullable=False)  # e.g., "ADMIN", "MANAGER", "SALES", "WAREHOUSE", "FINANCE"
    display_name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    is_system = Column(Boolean, default=False, nullable=False)  # System roles cannot be deleted
    allowed_screens = Column(String(500), nullable=False, default="dashboard")

    # Dynamic capability flags stored in SQL
    can_create_orders = Column(Boolean, default=False, nullable=False)
    can_approve_orders = Column(Boolean, default=False, nullable=False)
    can_adjust_stock = Column(Boolean, default=False, nullable=False)
    can_manage_products = Column(Boolean, default=False, nullable=False)
    can_manage_customers = Column(Boolean, default=False, nullable=False)
    can_manage_users = Column(Boolean, default=False, nullable=False)
    can_manage_settings = Column(Boolean, default=False, nullable=False)
    can_view_audit = Column(Boolean, default=False, nullable=False)

    # Relationships
    users = relationship("User", back_populates="role_rel")

    def __repr__(self) -> str:
        return f"<Role id={self.id} name='{self.name}' display_name='{self.display_name}'>"
