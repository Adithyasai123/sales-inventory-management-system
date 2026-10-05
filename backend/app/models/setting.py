from sqlalchemy import Column, Integer, String
from app.core.database import Base
from app.models.base import TimestampMixin


class SystemSetting(Base, TimestampMixin):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)

    def __repr__(self) -> str:
        return f"<SystemSetting key='{self.key}' value='{self.value}'>"
