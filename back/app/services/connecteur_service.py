from sqlalchemy import select

from ..exceptions.custom_exceptions import ConnecteurExistException, ConnecteurNotFound
from ..utils import PasswordUtils
from ..schemas.connecteur_schemas import ConnecteurCreateAuthTdt
from ..models.connecteur_auth_tdt import ConnecteurAuthTdt
from ..database import SessionLocal

import logging

logger = logging.getLogger(__name__)


class ConnecteurTdtService:
    """
    Service de gestion du connecteur Tdt
    """

    def create(self, connecteur_config: ConnecteurCreateAuthTdt, db=SessionLocal):
        with db() as db:
            db_connecteur = db.execute(
                select(ConnecteurAuthTdt)
                .where(ConnecteurAuthTdt.id_e == connecteur_config.id_e)
                .where(ConnecteurAuthTdt.flux == connecteur_config.flux)
            ).first()

            if db_connecteur:
                raise ConnecteurExistException(connecteur_config.id_e, connecteur_config.flux)
            key, encrypted_pwd = PasswordUtils.encrypt_password(connecteur_config.pwd_tech_tdt)

            # Enregistrer l'user dans la BD
            new_connecteur = ConnecteurAuthTdt(
                login_tech_tdt=connecteur_config.login_tech_tdt,
                id_e=connecteur_config.id_e,
                flux=connecteur_config.flux,
                pwd_tech_tdt=encrypted_pwd,
                pwd_key=key,
            )
            db.add(new_connecteur)
            db.commit()
            db.refresh(new_connecteur)

            logger.info(f"Creation du connecteur pour id_e {new_connecteur.id_e} flux {new_connecteur.flux} ")
            return new_connecteur

    def get_connecteur(self, flux: str, id_e: int, db=SessionLocal) -> ConnecteurAuthTdt:
        with db() as db:
            result = db.execute(
                select(ConnecteurAuthTdt).where(ConnecteurAuthTdt.id_e == id_e).where(ConnecteurAuthTdt.flux == flux)
            ).first()

            if not result:
                raise ConnecteurNotFound(id_e, flux)
        return result[0] if result else None
