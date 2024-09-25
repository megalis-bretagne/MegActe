from sqlalchemy import Boolean, Column, Integer, String
from sqlalchemy.orm import declarative_base


Base = declarative_base()


class Flux(Base):
    """Contient les flux disponible pour l'application

    Args:
        Base (_type_): Base Model

    Returns:
        _type_: _description_
    """

    __tablename__ = "megacte_flux"

    flux_id = Column(String, unique=True)
    enable = Column(Boolean)
