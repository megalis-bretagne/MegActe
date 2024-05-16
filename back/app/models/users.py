from sqlalchemy import Boolean, Column, Integer, String

from ..database import Base


class UserPastell(Base):
    __tablename__ = "table_name"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True)
    # TO COMPLETE
