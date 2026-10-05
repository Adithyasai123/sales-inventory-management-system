import enum
from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class OrderStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class SalesOrder(Base, TimestampMixin):
    __tablename__ = "sales_orders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(Enum(OrderStatus), default=OrderStatus.DRAFT, nullable=False, index=True)
    subtotal = Column(Numeric(12, 2), default=0.00, nullable=False)
    tax_rate = Column(Numeric(5, 2), default=0.00, nullable=False)
    tax_amount = Column(Numeric(12, 2), default=0.00, nullable=False)
    total_amount = Column(Numeric(12, 2), default=0.00, nullable=False, index=True)
    notes = Column(Text, nullable=True)
    requires_approval = Column(Boolean, default=False, nullable=False)

    # Relationships
    customer = relationship("Customer", back_populates="orders")
    creator = relationship("User", back_populates="orders_created", foreign_keys=[creator_id])
    items = relationship("SalesOrderItem", back_populates="order", cascade="all, delete-orphan", lazy="joined")
    approvals = relationship("OrderApproval", back_populates="order", cascade="all, delete-orphan", order_by="desc(OrderApproval.decided_at)")
    movements = relationship("InventoryMovement", back_populates="reference_order")

    def __repr__(self) -> str:
        return f"<SalesOrder id={self.id} number='{self.order_number}' status='{self.status}' total={self.total_amount}>"


class SalesOrderItem(Base, TimestampMixin):
    __tablename__ = "sales_order_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("sales_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    total_price = Column(Numeric(12, 2), nullable=False)

    # Relationships
    order = relationship("SalesOrder", back_populates="items")
    product = relationship("Product", back_populates="order_items", lazy="joined")

    def __repr__(self) -> str:
        return f"<SalesOrderItem id={self.id} order_id={self.order_id} product_id={self.product_id} qty={self.quantity}>"
