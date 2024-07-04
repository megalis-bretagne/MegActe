from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base

from ..utils import PasswordUtils

from ..utils import PasswordUtils

Base = declarative_base()


class UserPastell(Base):
    __tablename__ = "megacte_pastell_users"

    id = Column(Integer, primary_key=True)
    login = Column(String, unique=True)
    id_pastell = Column(Integer, unique=True)
    pwd_pastell = Column(String, unique=True)
    pwd_key = Column(String, unique=True)

    _cached_password = None

    def get_decrypt_password(self) -> str:
        """Retourne le mot de passe non crypté

        Returns:
            str: le mot de passe
        """
        if self._cached_password is None:
            self._cached_password = PasswordUtils().decrypt_password(
                self.pwd_pastell, self.pwd_key
            )
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
