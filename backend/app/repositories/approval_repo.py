from typing import List
from sqlalchemy.orm import Session, joinedload
from app.models.approval import OrderApproval, ApprovalDecision
from app.repositories.base import BaseRepository


class ApprovalRepository(BaseRepository[OrderApproval]):
    def __init__(self, db: Session):
        super().__init__(OrderApproval, db)

    def get_by_order_id(self, order_id: int) -> List[OrderApproval]:
        return (
            self.db.query(OrderApproval)
            .options(joinedload(OrderApproval.approver))
            .filter(OrderApproval.order_id == order_id)
            .order_by(OrderApproval.decided_at.desc())
            .all()
        )

    def record_decision(
        self,
        order_id: int,
        approver_id: int,
        decision: ApprovalDecision,
        comment: str,
    ) -> OrderApproval:
        approval = OrderApproval(
            order_id=order_id,
            approver_id=approver_id,
            decision=decision,
            comment=comment,
        )
        self.db.add(approval)
        self.db.flush()
        return approval
