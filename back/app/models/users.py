from sqlalchemy import Column, Integer, String
from .base import Base  # Assurez-vous de pointer vers la base SQLAlchemy

from ..utils import PasswordUtils


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
    pwd_pastell = Column(String)
    pwd_key = Column(String)

    _cached_password = None  # mot de passe non chiffré en cache

    def get_decrypt_password(self) -> str:
        """Retourne le mot de passe non crypté

        Returns:
            str: le mot de passe
        """
        if self._cached_password is None:
            self._cached_password = PasswordUtils().decrypt_password(self.pwd_pastell, self.pwd_key)
        return self._cached_password

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
