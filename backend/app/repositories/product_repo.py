from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.models.product import Product
from app.repositories.base import BaseRepository


class ProductRepository(BaseRepository[Product]):
    def __init__(self, db: Session):
        super().__init__(Product, db)

    def get_by_sku(self, sku: str) -> Optional[Product]:
        return (
            self.db.query(Product)
            .filter(Product.sku == sku.upper().strip(), Product.is_deleted == False)
            .first()
        )

    def get_for_update(self, product_ids: List[int]) -> List[Product]:
        """Locks product rows using SELECT ... FOR UPDATE to prevent race conditions during order confirmation/approval.
        Deduplicates, sorts IDs ascending for deadlock prevention, and calls populate_existing to refresh any cached instances."""
        unique_sorted_ids = sorted(set(product_ids))
        if not unique_sorted_ids:
            return []
        return (
            self.db.query(Product)
            .filter(Product.id.in_(unique_sorted_ids), Product.is_deleted == False)
            .order_by(Product.id.asc())
            .populate_existing()
            .with_for_update()
            .all()
        )

    def list_products(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        category: Optional[str] = None,
        is_low_stock: Optional[bool] = None,
        is_active: Optional[bool] = None,
        include_deleted: bool = False,
        sort_by: str = "name",
        sort_order: str = "asc",
    ) -> Tuple[List[Product], int]:
        filters = {}
        if is_active is not None:
            filters["is_active"] = is_active
        if category:
            filters["category"] = category

        custom_filter = (Product.stock_quantity <= Product.reorder_level) if is_low_stock else None

        return self.paginate(
            skip=skip,
            limit=limit,
            search=search,
            search_fields=["name", "sku", "category"],
            filters=filters or None,
            custom_filter=custom_filter,
            include_deleted=include_deleted,
            sort_by=sort_by,
            sort_order=sort_order,
            default_sort_by="name",
        )

    def get_low_stock_products(self) -> List[Product]:
        return (
            self.db.query(Product)
            .filter(
                Product.is_deleted == False,
                Product.is_active == True,
                Product.stock_quantity <= Product.reorder_level,
            )
            .order_by(Product.stock_quantity.asc())
            .all()
        )
