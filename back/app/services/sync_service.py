import logging
from collections.abc import Callable

from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..clients.pastell.api import ApiPastell
from ..clients.pastell.models.user_info import UserInfo
from ..models.users import UserPastell
from ..utils import PasswordUtils

logger = logging.getLogger(__name__)


class SyncUserService:
    """Service de synchronisation des utilisateurs Pastell vers la BDD Megacte."""

    def __init__(self, api_admin: ApiPastell):
        self.api_admin = api_admin

    def sync_users(self, db: Session) -> int:
        """Rapproche la table pastell_users avec l'ensemble des utilisateurs Pastell.

        Pour chaque entité, liste les utilisateurs et upsert les lignes locales.
        Les utilisateurs absents de Pastell sont marqués inactifs.

        Args:
            db (Session): session de BDD

        Returns:
            int: le nombre d'utilisateurs actifs synchronisés
        """
        seen_id_pastell: set[int] = set()
        entites = self.api_admin.perform_get("entite")
        for entite in entites:
            entite_id = entite["id_e"]
            users_json = self.api_admin.perform_get("utilisateur", query_params={"id_e": entite_id})
            for user_data in users_json:
                user_info = UserInfo.model_validate(user_data)
                seen_id_pastell.add(user_info.id_u)
                self._upsert_user(db, user_info)

        self._deactivate_missing_users(db, seen_id_pastell)
        db.commit()
        return len(seen_id_pastell)

    def find_and_upsert_user(self, login: str, db: Session) -> UserPastell | None:
        """Cherche un login donné dans Pastell via le scan des entités.

        Permet l'enrollment progressif : au premier login inconnu, on scanne Pastell
        et on crée la ligne locale si l'utilisateur existe.

        Args:
            login (str): le login à rechercher
            db (Session): session de BDD

        Returns:
            UserPastell | None: l'utilisateur créé en base, ou None si absent de Pastell
        """
        entites = self.api_admin.perform_get("entite")
        for entite in entites:
            entite_id = entite["id_e"]
            users_json = self.api_admin.perform_get("utilisateur", query_params={"id_e": entite_id})
            for user_data in users_json:
                user_info = UserInfo.model_validate(user_data)
                if user_info.login == login:
                    self._upsert_user(db, user_info)
                    db.commit()
                    return db.query(UserPastell).filter(UserPastell.login == login).first()
        return None

    def _upsert_user(self, db: Session, user_info: UserInfo) -> None:
        user = (
            db.query(UserPastell)
            .filter(
                or_(
                    UserPastell.login == user_info.login,
                    UserPastell.id_pastell == user_info.id_u,
                )
            )
            .first()
        )
        if user is None:
            user = UserPastell(
                login=user_info.login,
                id_pastell=user_info.id_u,
                active=user_info.active,
                pwd_key=PasswordUtils.generate_fernet_key(),
            )
            db.add(user)
            logger.info(f"Nouvel utilisateur Pastell enrolé : {user_info.login} (id_u={user_info.id_u})")
        else:
            if user.active != user_info.active:
                user.active = user_info.active
                logger.info(f"Mise à jour du statut actif de l'utilisateur {user_info.login} : {user_info.active}")

    def _deactivate_missing_users(self, db: Session, seen_id_pastell: set[int]) -> None:
        users = db.query(UserPastell).filter(UserPastell.active.is_(True)).all()
        for user in users:
            if user.id_pastell not in seen_id_pastell:
                user.active = False
                logger.info(f"Utilisateur désactivé (absent de Pastell) : {user.login}")


def run_sync(
    get_admin_api: Callable[[], ApiPastell],
    session_factory: Callable[[], Session],
) -> int:
    """Orchestre une synchronisation complète des utilisateurs Pastell.

    Args:
        get_admin_api: fonction retournant le client Pastell admin
        session_factory: fonction retournant une session de BDD

    Returns:
        int: le nombre d'utilisateurs actifs synchronisés
    """
    db = session_factory()
    try:
        service = SyncUserService(get_admin_api())
        return service.sync_users(db)
    finally:
        db.close()
