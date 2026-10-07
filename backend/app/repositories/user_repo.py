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
        scoped_branch: Optional[str] = None,
    ) -> Tuple[List[User], int]:
        custom_filter = None
        if scoped_manager_id is not None:
            conditions = [
                User.manager_id == scoped_manager_id,
                User.created_by_id == scoped_manager_id,
                User.id == scoped_manager_id,
            ]
            if scoped_branch:
                conditions.append(User.branch == scoped_branch)
            custom_filter = or_(*conditions)

        filters = {"role": role} if role else None

        return self.paginate(
            skip=skip,
            limit=limit,
            search=search,
            search_fields=["full_name", "email"],
            filters=filters,
            custom_filter=custom_filter,
            include_deleted=include_deleted,
            default_sort_by="id",
            sort_order="asc",
        )
