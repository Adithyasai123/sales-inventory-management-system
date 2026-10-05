import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class MovementType(str, enum.Enum):
    IN = "IN"
    OUT = "OUT"
    ADJUST = "ADJUST"


class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    movement_type = Column(Enum(MovementType), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    balance_after = Column(Integer, nullable=False)
    reference_order_id = Column(Integer, ForeignKey("sales_orders.id", ondelete="SET NULL"), nullable=True, index=True)
    reason = Column(String(255), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    # Relationships
    product = relationship("Product", back_populates="movements", lazy="joined")
    reference_order = relationship("SalesOrder", back_populates="movements")

    def __repr__(self) -> str:
        return f"<InventoryMovement id={self.id} product_id={self.product_id} type='{self.movement_type}' qty={self.quantity} balance={self.balance_after}>"
