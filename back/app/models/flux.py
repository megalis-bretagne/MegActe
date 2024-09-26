from sqlalchemy import Boolean, Integer, Column, String
from .base import Base  # Assurez-vous de pointer vers la base SQLAlchemy


class FluxAvailable(Base):
    """Contient les flux disponible pour l'application

    Args:
        Base (_type_): Base Model

    Returns:
        _type_: _description_
    """

    __tablename__ = "flux_available"

    id = Column(Integer, primary_key=True, autoincrement=True)
    flux_id_pastell = Column(String, unique=True)
    enable = Column(Boolean, nullable=False)
