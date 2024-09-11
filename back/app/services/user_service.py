from sqlalchemy import or_
from ..clients.pastell.api import ApiPastell
from ..utils import PasswordUtils

from sqlalchemy.orm import Session

from ..schemas.user_schemas import UserCreate

from ..exceptions.custom_exceptions import (
    UserNotFoundException,
    UserExistException,
    UserRegistrationException,
)
from ..models.users import UserPastell
import logging

logger = logging.getLogger(__name__)


# Get liste de tous les users
def get_all_users_from_db(db: Session):
    users = db.query(UserPastell).all()
    return users


# Add user
def add_user_to_db(user_data: UserCreate, client_api: ApiPastell, db: Session):
    """Ajouter un nouvel utilisateur dans la BD et envoyer le mot de passe non chifré à PASTELL

    Args:
        user_data (UserCreate): Les données du user à ajouter.
        db (Session, optional): La session de base de données. Defaults to Depends(get_db).

    Returns:
        UserPastell: L'utilisateur nouvellement créé.
    """
    # Chiffrer le pwd

    # check user_existe
    db_user = (
        db.query(UserPastell)
        .filter(
            or_(
                UserPastell.login == user_data.login,
                UserPastell.id_pastell == user_data.id_pastell,
            )
        )
        .first()
    )
    if db_user:
        raise UserExistException(user_data.login)

    key, encrypted_pwd = PasswordUtils.encrypt_password(user_data.pwd_pastell)

    # Enregistrer l'user dans la BD
    new_user = UserPastell(
        login=user_data.login,
        id_pastell=user_data.id_pastell,
        pwd_pastell=encrypted_pwd,
        pwd_key=key,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    logger.info(f"Creation Utilisateur : {new_user}")

    if new_user.id is None:
        raise UserRegistrationException("Failed to register the user in the database")

    # Envoyer le pwd non chifré à PASTELL

    client_api.perform_patch(
        f"/utilisateur/{user_data.id_pastell}", {"password": user_data.pwd_pastell}
    )

    return new_user


# Delete User
def delete_user_from_db(user_id: int, db: Session):
    db_user = db.query(UserPastell).filter(UserPastell.id == user_id).first()
    if not db_user:
        raise UserNotFoundException()

    db.delete(db_user)
    db.commit()

    return {"message": "User deleted successfully"}


# Get user context
def get_user_context_service(client_api: ApiPastell, user: UserPastell):
    """Récupère le contexte du user à partir de Pastell en utilisant le jeton Keycloak réceptionner côté API

    Args:
        client_api: le client Api Pastell
        user : L'utilisateur récupéré depuis la BD

    Raises:
        PastellException:  Si les infos du user ne peuvent pas être récupérées depuis Pastell.
        PastellException: Si les entités du user ne peuvent pas être récupérées depuis Pastell.

    Returns:
       dict: Un dictionnaire contenant les infos du user et ses entités.
    """

    # Récupérer les infos du user depuis Pastell
    user_info = client_api.get_user_by_id_u(user.id_pastell)
    if user_info.id_e == 0:
        return {"user_info": user_info}

    # Récupérer les entités du user depuis Pastell
    user_entites = client_api.get_entite(only_active=True)

    return {"user_info": user_info, "entites": user_entites}
