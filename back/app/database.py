import logging
import time

from fastapi import Depends
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from .dependencies import get_current_user, get_settings
from .exceptions.custom_exceptions import UserNotFoundException, UserRegistrationException
from .models.users import UserPastell

logger = logging.getLogger(__name__)
engine = create_engine(get_settings().database.database_url, pool_pre_ping=True, pool_recycle=30)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Cache négatif pour les logins inconnus : évite de scanner Pastell à chaque requête
# quand un login n'existe pas (progressive enrollment coûteux côté Pastell).
_NEGATIVE_CACHE_TTL_S = 300
_unknown_login_cache: dict[str, float] = {}


def _prune_unknown_login_cache() -> None:
    """Supprime les entrées expirées du cache négatif pour éviter une croissance illimitée."""
    now = time.monotonic()
    for login in list(_unknown_login_cache):
        if now - _unknown_login_cache[login] > _NEGATIVE_CACHE_TTL_S:
            del _unknown_login_cache[login]


# Dépendance de session de base de données
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _ensure_user_has_token(user: UserPastell, db: Session) -> None:
    """Crée un token Pastell pour l'utilisateur s'il n'en a pas de valide.

    S'exécute au premier accès de l'utilisateur (aucun token configuré dans la
    table pastell_users) : le mot de passe Pastell de l'utilisateur est réinitialisé
    via le compte technique, puis un token est créé par l'utilisateur lui-même via
    l'endpoint self-service POST /v2/utilisateur/token. Seul le token (chiffré) est
    conservé en base.

    Args:
        user (UserPastell): l'utilisateur
        db (Session): session de BDD
    """
    if user.is_token_valid():
        return

    from .services import get_or_make_api_pastell_for_admin
    from .services.user_service import UserService

    admin_api = get_or_make_api_pastell_for_admin()
    try:
        UserService(admin_api).create_user_token(user, db)
    except Exception as e:
        logger.error(f"Échec de création du token pour l'utilisateur {user.login} : {e}")
        raise UserRegistrationException(f"Impossible de créer un token pour l'utilisateur {user.login}") from e


def get_user_from_db(login_user: dict = Depends(get_current_user), db: Session = Depends(get_db)) -> UserPastell:
    """Récupère l'utilisateur depuis la BD, avec enrollment progressif.

    Args:
        current_user (dict): Le dictionnaire contenant les infos du user actuel
        db (Session): La session de BD

    Raises:
        UserNotFoundException: Si le user n'est pas trouvé dans la BD ni dans Pastell.

    Returns:
        UserPastell: L'utilisateur récupéré depuis la BD.
    """
    logger.debug(f"Getting User form DB : {login_user}")
    user = db.query(UserPastell).filter(UserPastell.login == login_user).first()
    if user and user.active:
        _unknown_login_cache.pop(login_user, None)
        _ensure_user_has_token(user, db)
        return user

    # Utilisateur inconnu ou inactif : tentative d'enrôlement via Pastell
    _prune_unknown_login_cache()
    if login_user in _unknown_login_cache:
        raise UserNotFoundException()
    user = _try_enroll(login_user, db)
    if not user or not user.active:
        _unknown_login_cache[login_user] = time.monotonic()
        raise UserNotFoundException()

    _unknown_login_cache.pop(login_user, None)
    _ensure_user_has_token(user, db)
    return user


def _try_enroll(login: str, db: Session) -> UserPastell | None:
    """Tente d'enrôler un utilisateur inconnu en le cherchant dans Pastell.

    Args:
        login (str): le login à chercher
        db (Session): session de BDD

    Returns:
        UserPastell | None: l'utilisateur créé, ou None s'il n'existe pas dans Pastell
    """
    from .services import get_or_make_api_pastell_for_admin
    from .services.sync_service import SyncUserService

    return SyncUserService(get_or_make_api_pastell_for_admin()).find_and_upsert_user(login, db)
