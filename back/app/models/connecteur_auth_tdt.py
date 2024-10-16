from sqlalchemy import Integer, Column, String, UniqueConstraint

from ..utils import PasswordUtils
from .base import Base  # Assurez-vous de pointer vers la base SQLAlchemy


class ConnecteurAuthTdt(Base):
    """Contient les infos de connection au tdt pour chaque connecteur

    Args:
        Base (_type_): Base Model

    Returns:
        _type_: _description_
    """

    __tablename__ = "connecteur_auth_tdt"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_e = Column(Integer, nullable=False)
    flux = Column(String, nullable=False)
    login_tech_tdt = Column(String, nullable=False)
    pwd_tech_tdt = Column(String, nullable=False)
    pwd_key = Column(String, nullable=False)

    UniqueConstraint("id_e", "flux", name="id_e_flux")

    def get_decrypt_password(self) -> str:
        """Retourne le mot de passe non crypté

        Returns:
            str: le mot de passe
        """
        return PasswordUtils().decrypt_password(self.pwd_tech_tdt, self.pwd_key)
