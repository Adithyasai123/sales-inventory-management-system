from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.role import Role
from app.repositories.base import BaseRepository


class RoleRepository(BaseRepository[Role]):
    def __init__(self, db: Session):
        super().__init__(Role, db)

    def get_by_name(self, name: str) -> Optional[Role]:
        return self.db.query(Role).filter(Role.name == name.upper().strip()).first()

    def list_roles(self, search: Optional[str] = None) -> List[Role]:
        items, _ = self.paginate(
            skip=0,
            limit=1000,
            search=search,
            search_fields=["name", "display_name", "description"],
            sort_by="id",
            sort_order="asc",
        )
        return items
