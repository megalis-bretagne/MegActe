import base64
from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from cryptography.fernet import Fernet

from ..clients.pastell.models.auth import AuthUser

Base = declarative_base()


class UserPastell(Base):
    __tablename__ = "megacte_pastell_users"

    id = Column(Integer, primary_key=True)
    login = Column(String, unique=True)
    id_pastell = Column(Integer, unique=True)
    pwd_pastell = Column(String, unique=True)
    pwd_key = Column(String, unique=True)

    _cached_password = None

    def to_auth_api(self) -> AuthUser:
        """
        Construit un objet permettant de se connecter aux API pastell avec le compte utilisateur

        Returns:
            AuthUser: _description_
        """
        return AuthUser(
            login=self.login,
            pwd=self._decrypt_password(),
        )

    def _decrypt_password(self) -> str:
        if self._cached_password is None:
            fernet = Fernet(base64.urlsafe_b64decode(self.pwd_key.encode("utf-8")))
            self._cached_password = fernet.decrypt(
                self.pwd_pastell.encode("utf-8")
            ).decode()
        return self._cached_password
