from sqlalchemy import or_, select

from ..exceptions.custom_exceptions import ConnecteurExistException
from ..utils import PasswordUtils
from ..schemas.connecteur_schemas import ConnecteurCreateAuthTdt
from ..models.connecteur_auth_tdt import ConnecteurAuthTdt
from ..database import SessionLocal
from sqlalchemy.orm import Session

import logging

logger = logging.getLogger(__name__)


class ConnecteurTdtService:

    def create(self, connecteur_config: ConnecteurCreateAuthTdt, db: Session):

        db_connecteur = db.execute(
            select(ConnecteurAuthTdt)
            .where(ConnecteurAuthTdt.id_e == connecteur_config.id_e)
            .where(ConnecteurAuthTdt.flux == connecteur_config.flux)
        ).first()

        if db_connecteur:
            raise ConnecteurExistException(
                connecteur_config.id_e, connecteur_config.flux
            )
        key, encrypted_pwd = PasswordUtils.encrypt_password(
            connecteur_config.pwd_tech_tdt
        )

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

        logger.info(
            f"Creation du connecteur pour id_e {new_connecteur.id_e} flux {new_connecteur.flux} "
        )
        return new_connecteur
