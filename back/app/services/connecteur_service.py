import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..exceptions.custom_exceptions import ConnecteurExistException, ConnecteurNotFound
from ..models.connecteur_auth_tdt import ConnecteurAuthTdt
from ..schemas.connecteur_schemas import ConnecteurCreateAuthTdt
from ..utils import PasswordUtils
from . import get_or_make_api_pastell_for_admin, get_or_make_api_s2low

logger = logging.getLogger(__name__)


class ConnecteurTdtService:
    """
    Service de gestion du connecteur Tdt
    """

    def create(self, connecteur_config: ConnecteurCreateAuthTdt, db=SessionLocal):
        with db() as inner_db:
            db_connecteur = inner_db.execute(
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
            inner_db.add(new_connecteur)
            inner_db.commit()
            inner_db.refresh(new_connecteur)

            logger.info(f"Creation du connecteur pour id_e {new_connecteur.id_e} flux {new_connecteur.flux} ")
            return new_connecteur

    def get_connecteur(self, flux: str, id_e: int, db=SessionLocal) -> ConnecteurAuthTdt:
        with db() as inner_db:
            result = inner_db.execute(
                select(ConnecteurAuthTdt).where(ConnecteurAuthTdt.id_e == id_e).where(ConnecteurAuthTdt.flux == flux)
            ).first()

            if not result:
                result = inner_db.execute(
                    select(ConnecteurAuthTdt)
                    .where(ConnecteurAuthTdt.id_e == id_e)
                    .where(ConnecteurAuthTdt.s2low_authority_id.is_not(None))
                ).first()

            if not result:
                raise ConnecteurNotFound(id_e, flux)
        return result[0] if result else None

    def ensure_s2low_account(
        self,
        user,
        siret: str,
        db: Session,
        pastell_api=None,
        s2low_api=None,
    ) -> ConnecteurAuthTdt:
        """Crée à la demande le compte S2low associé à l'entité de l'utilisateur."""
        pastell_api = pastell_api or get_or_make_api_pastell_for_admin()
        s2low_api = s2low_api or get_or_make_api_s2low()
        id_e = pastell_api.get_user_by_id_u(user.id_pastell).id_e
        if id_e is None:
            raise ValueError(f"L'utilisateur Pastell {user.login} n'a pas d'entité")

        existing = db.scalars(select(ConnecteurAuthTdt).where(ConnecteurAuthTdt.id_e == id_e)).first()
        if existing:
            return existing

        authorities = s2low_api.get_authority_by_siret(siret)
        if not authorities or not isinstance(authorities, list):
            raise ValueError(f"Aucune collectivité S2low trouvée pour le SIRET {siret}")
        authority_id = authorities[0].get("id")
        if authority_id is None:
            raise ValueError(f"Réponse S2low invalide pour le SIRET {siret}: {authorities!r}")

        authority_id = int(authority_id)
        technical_login = f"megacte_{authority_id}"
        users = s2low_api.get_users(authority_id, "MegActe")
        if isinstance(users, dict):
            users = users.get("users", users.get("data", []))
        user_names = [str(user.get("name", "")).strip() for user in users] if isinstance(users, list) else []
        existing_user = any(name.casefold() == "megacte" for name in user_names)
        logger.debug(
            "S2low technical account lookup for authority %s returned names: %s",
            authority_id,
            user_names,
        )
        password_salt = s2low_api._config.password_salt
        if not password_salt:
            raise ValueError("Le salt des mots de passe S2low n'est pas configuré")
        password = PasswordUtils.generate_s2low_password(authority_id, password_salt)
        if existing_user:
            logger.debug("Megacte technical account for s2low found with login : %s", technical_login)
        else:
            s2low_api.create_technical_user(authority_id, password)
            logger.info("Megacte technical account for s2low added with login : %s", technical_login)
        key, encrypted_password = PasswordUtils.encrypt_password(password)
        connecteur = ConnecteurAuthTdt(
            id_e=id_e,
            flux="",
            login_tech_tdt=technical_login,
            pwd_tech_tdt=encrypted_password,
            pwd_key=key,
            s2low_authority_id=authority_id,
        )
        db.add(connecteur)
        db.commit()
        db.refresh(connecteur)
        return connecteur
