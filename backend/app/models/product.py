from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, CheckConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, SoftDeleteMixin


class Product(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sku = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(150), index=True, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), index=True, nullable=True)
    price = Column(Numeric(12, 2), nullable=False)
    cost_price = Column(Numeric(12, 2), nullable=True)
    stock_quantity = Column(Integer, default=0, nullable=False)
    reserved_quantity = Column(Integer, default=0, nullable=False)
    reorder_level = Column(Integer, default=10, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)

    __table_args__ = (
        CheckConstraint("stock_quantity >= 0", name="chk_stock_non_negative"),
        CheckConstraint("reserved_quantity >= 0", name="chk_reserved_non_negative"),
    )

    @property
    def available_quantity(self) -> int:
        return max(0, self.stock_quantity - self.reserved_quantity)

    # Relationships
    order_items = relationship("SalesOrderItem", back_populates="product")
    movements = relationship("InventoryMovement", back_populates="product")

    def __repr__(self) -> str:
        return f"<Product id={self.id} sku='{self.sku}' name='{self.name}' stock={self.stock_quantity}>"
