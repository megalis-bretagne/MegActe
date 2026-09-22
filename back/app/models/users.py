from datetime import UTC, datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String

from ..utils import PasswordUtils
from .base import Base  # Assurez-vous de pointer vers la base SQLAlchemy


class UserPastell(Base):
    """Model User Pastell

    Args:
        Base (_type_): _description_

    Returns:
        _type_: _description_
    """

    __tablename__ = "pastell_users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    login = Column(String, unique=True, nullable=False, index=True)
    id_pastell = Column(Integer, unique=True, nullable=False)
    pwd_key = Column(String)
    token_name = Column(String)
    token = Column(String)
    token_expires_at = Column(DateTime(timezone=True), nullable=True)
    active = Column(Boolean, default=True, nullable=False)

    _cached_token = None

    def get_decrypt_token(self) -> str:
        if self._cached_token is None:
            self._cached_token = PasswordUtils.decrypt_with_key(self.token, self.pwd_key)
        return self._cached_token

    def is_token_valid(self) -> bool:
        if not self.token:
            return False
        if self.token_expires_at is None:
            return True
        return datetime.now(UTC) < self.token_expires_at

    def __eq__(self, other):
        if not isinstance(other, UserPastell):
            return NotImplemented
        return (self.id, self.login, self.id_pastell) == (
            other.id,
            other.login,
            other.id_pastell,
        )

    def __hash__(self):
        return hash((self.id, self.login, self.id_pastell))
