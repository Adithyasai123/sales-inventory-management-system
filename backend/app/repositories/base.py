from typing import Generic, Type, TypeVar, Optional, List, Tuple, Any, Dict, Callable
import math
from sqlalchemy.orm import Session, Query
from sqlalchemy import desc, asc, or_
from app.core.database import Base
from app.schemas.common import PaginatedResponse

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """
    Generic Base Repository providing reusable database operations
    similar to Mongoose/Prisma generic repository patterns in Node.js.
    """

    def __init__(self, model: Type[ModelType], db: Session):
        self.model = model
        self.db = db

    def get_by_id(self, id: Any) -> Optional[ModelType]:
        query = self.db.query(self.model).filter(self.model.id == id)
        if hasattr(self.model, "is_deleted"):
            query = query.filter(self.model.is_deleted == False)
        return query.first()

    def get_by_id_including_deleted(self, id: Any) -> Optional[ModelType]:
        return self.db.query(self.model).filter(self.model.id == id).first()

    def get_multi(
        self,
        skip: int = 0,
        limit: int = 100,
        include_deleted: bool = False,
    ) -> Tuple[List[ModelType], int]:
        query = self.db.query(self.model)
        if hasattr(self.model, "is_deleted") and not include_deleted:
            query = query.filter(self.model.is_deleted == False)

        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    def paginate(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        search_fields: Optional[List[str]] = None,
        filters: Optional[Dict[str, Any]] = None,
        custom_filter: Optional[Any] = None,
        include_deleted: bool = False,
        sort_by: Optional[str] = None,
        sort_order: str = "asc",
        default_sort_by: str = "id",
    ) -> Tuple[List[ModelType], int]:
        """
        Generic dynamic query engine (Node.js style):
        Handles soft-delete filtering, equality filters, multi-column search,
        dynamic sorting, total counting, and pagination slicing in one place.
        """
        query: Query = self.db.query(self.model)

        # 1. Soft-delete check
        if hasattr(self.model, "is_deleted") and not include_deleted:
            query = query.filter(self.model.is_deleted == False)

        # 2. Key-value equality filters (e.g. {"is_active": True, "category": "Phones"})
        if filters:
            for field, val in filters.items():
                if val is not None and hasattr(self.model, field):
                    query = query.filter(getattr(self.model, field) == val)

        # 3. Custom SQLAlchemy expression (e.g. stock_quantity <= reorder_level)
        if custom_filter is not None:
            query = query.filter(custom_filter)

        # 4. Dynamic multi-column text search (ILIKE)
        if search and search_fields:
            term = f"%{search.strip()}%"
            conditions = [
                getattr(self.model, col).ilike(term)
                for col in search_fields
                if hasattr(self.model, col)
            ]
            if conditions:
                query = query.filter(or_(*conditions))

        # 5. Dynamic sorting
        active_sort = sort_by or default_sort_by
        sort_col = getattr(self.model, active_sort, getattr(self.model, "id", None))
        if sort_col is not None:
            query = query.order_by(desc(sort_col) if sort_order.lower() == "desc" else asc(sort_col))

        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    def create(self, obj: ModelType) -> ModelType:
        self.db.add(obj)
        self.db.flush()
        return obj

    def update(self, obj: ModelType) -> ModelType:
        self.db.flush()
        return obj

    def restore(self, obj: ModelType) -> ModelType:
        if hasattr(obj, "restore"):
            obj.restore()
            self.db.flush()
        elif hasattr(obj, "is_deleted"):
            obj.is_deleted = False
            self.db.flush()
        return obj

    def delete(self, obj: ModelType, soft: bool = True) -> None:
        if soft and hasattr(obj, "soft_delete"):
            obj.soft_delete()
            self.db.flush()
        elif soft and hasattr(obj, "is_deleted"):
            obj.is_deleted = True
            self.db.flush()
        else:
            self.db.delete(obj)
            self.db.flush()


def to_paginated_response(
    items: List[Any],
    total: int,
    page: int,
    page_size: int,
) -> PaginatedResponse:
    """Helper to convert items and total into a standard PaginatedResponse."""
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


def handle_paginated_query(
    query_fn: Callable[..., Tuple[List[Any], int]],
    page: int = 1,
    page_size: int = 20,
    mapper: Optional[Callable[[Any], Any]] = None,
    **kwargs: Any,
) -> PaginatedResponse:
    """
    Higher-order dynamic callback runner (like Express middleware/controllers):
    Calculates skip/limit, calls the repository function, optionally maps items, and returns PaginatedResponse automatically.
    """
    skip = (page - 1) * page_size
    items, total = query_fn(skip=skip, limit=page_size, **kwargs)
    if mapper is not None:
        items = [mapper(item) for item in items]
    return to_paginated_response(items=items, total=total, page=page, page_size=page_size)
