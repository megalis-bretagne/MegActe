from sqlalchemy import Boolean, Column, Integer, String

from ..database import Base


class UserPastell(Base):
    __tablename__ = "megacte_pastell_users"

    id = Column(Integer, primary_key=True)
    login = Column(String, unique=True)
    id_user = Column(Integer, unique=True)
    pwd_pastell = Column(Integer, unique=True)
    # TO COMPLETE
