from sqlalchemy import Column, String, Integer
from app.core.database import Base


class Sequence(Base):
    __tablename__ = "sequences"

    name = Column(String(50), primary_key=True, index=True)
    last_value = Column(Integer, nullable=False, default=0)

    def __repr__(self) -> str:
        return f"<Sequence name='{self.name}' last_value={self.last_value}>"
