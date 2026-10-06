from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.user import User, UserRole
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, db: Session):
        super().__init__(User, db)

    def get_by_email(self, email: str) -> Optional[User]:
        return (
            self.db.query(User)
            .filter(User.email == email.lower().strip(), User.is_deleted == False)
            .first()
        )

    def get_active_managers(self) -> List[User]:
        return (
            self.db.query(User)
            .filter(
                User.role.in_([UserRole.MANAGER, UserRole.ADMIN]),
                User.is_active == True,
                User.is_deleted == False,
            )
            .all()
        )

    def list_users(
        self,
        skip: int = 0,
        limit: int = 20,
        role: Optional[UserRole] = None,
        search: Optional[str] = None,
        include_deleted: bool = False,
        scoped_manager_id: Optional[int] = None,
    ) -> Tuple[List[User], int]:
        query = self.db.query(User)
        if not include_deleted:
            query = query.filter(User.is_deleted == False)

        if scoped_manager_id is not None:
            query = query.filter(
                or_(
                    User.manager_id == scoped_manager_id,
                    User.created_by_id == scoped_manager_id,
                )
            )

        if role:
            query = query.filter(User.role == role)

        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    User.full_name.ilike(search_term),
                    User.email.ilike(search_term),
                )
            )

        total = query.count()
        items = query.order_by(User.id.asc()).offset(skip).limit(limit).all()
        return items, total
