from datetime import datetime, timezone
from typing import Optional, List, Tuple, Dict
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, desc, asc, func
from app.models.order import SalesOrder, SalesOrderItem, OrderStatus
from app.models.customer import Customer
from app.models.sequence import Sequence
from app.repositories.base import BaseRepository


class OrderRepository(BaseRepository[SalesOrder]):
    def __init__(self, db: Session):
        super().__init__(SalesOrder, db)

    def get_by_order_number(self, order_number: str) -> Optional[SalesOrder]:
        return (
            self.db.query(SalesOrder)
            .filter(SalesOrder.order_number == order_number.strip())
            .first()
        )

    def get_with_details(self, order_id: int) -> Optional[SalesOrder]:
        return (
            self.db.query(SalesOrder)
            .options(
                joinedload(SalesOrder.customer),
                joinedload(SalesOrder.creator),
                joinedload(SalesOrder.items).joinedload(SalesOrderItem.product),
                joinedload(SalesOrder.approvals),
            )
            .filter(SalesOrder.id == order_id)
            .first()
        )

    def list_orders(
        self,
        skip: int = 0,
        limit: int = 20,
        status: Optional[OrderStatus] = None,
        customer_id: Optional[int] = None,
        creator_id: Optional[int] = None,
        search: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> Tuple[List[SalesOrder], int]:
        query = (
            self.db.query(SalesOrder)
            .join(SalesOrder.customer)
            .options(
                joinedload(SalesOrder.customer),
                joinedload(SalesOrder.creator),
            )
        )

        if status:
            query = query.filter(SalesOrder.status == status)

        if customer_id:
            query = query.filter(SalesOrder.customer_id == customer_id)

        if creator_id:
            query = query.filter(SalesOrder.creator_id == creator_id)

        if date_from:
            query = query.filter(SalesOrder.created_at >= date_from)

        if date_to:
            query = query.filter(SalesOrder.created_at <= date_to)

        if search:
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    SalesOrder.order_number.ilike(term),
                    Customer.name.ilike(term),
                )
            )

        sort_col = getattr(SalesOrder, sort_by, SalesOrder.created_at)
        query = query.order_by(desc(sort_col) if sort_order == "desc" else asc(sort_col))

        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    def get_pending_approvals(self, skip: int = 0, limit: int = 50) -> Tuple[List[SalesOrder], int]:
        query = (
            self.db.query(SalesOrder)
            .options(
                joinedload(SalesOrder.customer),
                joinedload(SalesOrder.creator),
                joinedload(SalesOrder.items),
            )
            .filter(SalesOrder.status == OrderStatus.PENDING_APPROVAL)
            .order_by(SalesOrder.created_at.asc())
        )
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    def count_by_status(self) -> Dict[str, int]:
        results = (
            self.db.query(SalesOrder.status, func.count(SalesOrder.id))
            .group_by(SalesOrder.status)
            .all()
        )
        return {status.value: count for status, count in results}

    def generate_next_order_number(self) -> str:
        """Atomically generate the next sequential order number using SELECT ... FOR UPDATE on sequences table.
        Format: ORD-YYYYMMDD-0001
        """
        today_str = datetime.now(timezone.utc).strftime("%Y%m%d")
        prefix = f"ORD-{today_str}-"
        seq_name = f"order_{today_str}"

        try:
            seq_row = (
                self.db.query(Sequence)
                .filter(Sequence.name == seq_name)
                .with_for_update()
                .first()
            )
            if seq_row is None:
                seq_row = Sequence(name=seq_name, last_value=0)
                self.db.add(seq_row)
                self.db.flush()
                seq_row = (
                    self.db.query(Sequence)
                    .filter(Sequence.name == seq_name)
                    .with_for_update()
                    .first()
                )

            seq_row.last_value += 1
            next_seq = seq_row.last_value
        except Exception:
            # Fallback for environments where sequences table is unavailable
            last_order = (
                self.db.query(SalesOrder.order_number)
                .filter(SalesOrder.order_number.like(f"{prefix}%"))
                .order_by(SalesOrder.order_number.desc())
                .first()
            )
            if last_order and last_order[0]:
                last_seq = int(last_order[0].split("-")[-1])
                next_seq = last_seq + 1
            else:
                next_seq = 1

        return f"{prefix}{next_seq:04d}"
