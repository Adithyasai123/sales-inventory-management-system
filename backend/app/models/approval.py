import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Text, Enum, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class ApprovalDecision(str, enum.Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class OrderApproval(Base):
    __tablename__ = "order_approvals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("sales_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    decision = Column(Enum(ApprovalDecision), nullable=False, index=True)
    comment = Column(Text, nullable=True)
    decided_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    order = relationship("SalesOrder", back_populates="approvals")
    approver = relationship("User", back_populates="approvals_decided", foreign_keys=[approver_id], lazy="joined")

    def __repr__(self) -> str:
        return f"<OrderApproval id={self.id} order_id={self.order_id} approver_id={self.approver_id} decision='{self.decision}'>"
