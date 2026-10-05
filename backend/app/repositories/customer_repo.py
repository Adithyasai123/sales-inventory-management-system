from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.models.customer import Customer
from app.repositories.base import BaseRepository


class CustomerRepository(BaseRepository[Customer]):
    def __init__(self, db: Session):
        super().__init__(Customer, db)

    def get_by_email(self, email: str) -> Optional[Customer]:
        return (
            self.db.query(Customer)
            .filter(Customer.email == email.lower().strip(), Customer.is_deleted == False)
            .first()
        )

    def list_customers(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        sort_by: str = "name",
        sort_order: str = "asc",
    ) -> Tuple[List[Customer], int]:
        query = self.db.query(Customer).filter(Customer.is_deleted == False)

        if is_active is not None:
            query = query.filter(Customer.is_active == is_active)

        if search:
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Customer.name.ilike(term),
                    Customer.email.ilike(term),
                    Customer.company.ilike(term),
                    Customer.phone.ilike(term),
                )
            )

        sort_col = getattr(Customer, sort_by, Customer.name)
        query = query.order_by(desc(sort_col) if sort_order == "desc" else asc(sort_col))

        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total
