from sqlalchemy import Boolean, Column, Integer, String, UUID

from ..database import Base


class UserPastell(Base):
    __tablename__ = "megacte_pastell_users"

    id = Column(Integer, primary_key=True)
    # id_public = Column(UUID(as_uuid=True), unique=True, default=uuid.uuid4)
    login = Column(String, unique=True)
    id_pastell = Column(Integer, unique=True)
    pwd_pastell = Column(String, unique=True)
    pwd_key = Column(String, unique=True)
