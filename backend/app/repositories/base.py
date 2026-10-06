from typing import Generic, Type, TypeVar, Optional, List, Tuple, Any
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc, asc
from app.core.database import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], db: Session):
        self.model = model
        self.db = db

    def get_by_id(self, id: Any) -> Optional[ModelType]:
        query = self.db.query(self.model).filter(self.model.id == id)
        if hasattr(self.model, "is_deleted"):
            query = query.filter(self.model.is_deleted == False)
        return query.first()

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

    def create(self, obj: ModelType) -> ModelType:
        self.db.add(obj)
        self.db.flush()
        return obj

    def update(self, obj: ModelType) -> ModelType:
        self.db.flush()
        return obj

    def get_by_id_including_deleted(self, id: Any) -> Optional[ModelType]:
        return self.db.query(self.model).filter(self.model.id == id).first()

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
        else:
            self.db.delete(obj)
            self.db.flush()

