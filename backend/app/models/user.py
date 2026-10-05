import enum
from sqlalchemy import Column, Integer, String, Boolean, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, SoftDeleteMixin


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    SALES = "SALES"


class User(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.SALES, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    orders_created = relationship("SalesOrder", back_populates="creator", foreign_keys="SalesOrder.creator_id")
    approvals_decided = relationship("OrderApproval", back_populates="approver", foreign_keys="OrderApproval.approver_id")

    def __repr__(self) -> str:
        return f"<User id={self.id} email='{self.email}' role='{self.role}'>"
