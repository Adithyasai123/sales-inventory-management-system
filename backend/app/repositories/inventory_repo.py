from datetime import datetime
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from app.models.inventory import InventoryMovement, MovementType
from app.repositories.base import BaseRepository


class InventoryRepository(BaseRepository[InventoryMovement]):
    def __init__(self, db: Session):
        super().__init__(InventoryMovement, db)

    def record_movement(
        self,
        product_id: int,
        movement_type: MovementType,
        quantity: int,
        balance_after: int,
        reference_order_id: Optional[int] = None,
        reason: Optional[str] = None,
    ) -> InventoryMovement:
        movement = InventoryMovement(
            product_id=product_id,
            movement_type=movement_type,
            quantity=quantity,
            balance_after=balance_after,
            reference_order_id=reference_order_id,
            reason=reason,
        )
        self.db.add(movement)
        self.db.flush()
        return movement

    def list_movements(
        self,
        skip: int = 0,
        limit: int = 20,
        product_id: Optional[int] = None,
        movement_type: Optional[MovementType] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> Tuple[List[InventoryMovement], int]:
        query = (
            self.db.query(InventoryMovement)
            .options(joinedload(InventoryMovement.product))
        )

        if product_id:
            query = query.filter(InventoryMovement.product_id == product_id)

        if movement_type:
            query = query.filter(InventoryMovement.movement_type == movement_type)

        if date_from:
            query = query.filter(InventoryMovement.created_at >= date_from)

        if date_to:
            query = query.filter(InventoryMovement.created_at <= date_to)

        total = query.count()
        items = query.order_by(InventoryMovement.created_at.desc()).offset(skip).limit(limit).all()
        return items, total
