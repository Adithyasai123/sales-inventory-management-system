from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.role import Role


class RoleRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, role_id: int) -> Optional[Role]:
        return self.db.query(Role).filter(Role.id == role_id).first()

    def get_by_name(self, name: str) -> Optional[Role]:
        return self.db.query(Role).filter(Role.name == name.upper().strip()).first()

    def list_roles(self, search: Optional[str] = None) -> List[Role]:
        query = self.db.query(Role)
        if search:
            search_clean = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Role.name.ilike(search_clean),
                    Role.display_name.ilike(search_clean),
                    Role.description.ilike(search_clean),
                )
            )
        return query.order_by(Role.id.asc()).all()

    def create(self, role: Role) -> Role:
        self.db.add(role)
        self.db.flush()
        return role

    def update(self, role: Role) -> Role:
        self.db.flush()
        return role

    def delete(self, role: Role) -> None:
        self.db.delete(role)
        self.db.flush()
