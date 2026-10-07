from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
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
        include_deleted: bool = False,
        sort_by: str = "name",
        sort_order: str = "asc",
    ) -> Tuple[List[Customer], int]:
        filters = {"is_active": is_active} if is_active is not None else None
        return self.paginate(
            skip=skip,
            limit=limit,
            search=search,
            search_fields=["name", "email", "company", "phone"],
            filters=filters,
            include_deleted=include_deleted,
            sort_by=sort_by,
            sort_order=sort_order,
            default_sort_by="name",
        )
