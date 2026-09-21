import logging

from requests.auth import HTTPBasicAuth
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..exceptions.custom_exceptions import (
    UserExistException,
    UserNotFoundException,
    UserRegistrationException,
)
from ..models.users import UserPastell
from ..schemas.user_schemas import UserCreate
from ..utils import PasswordUtils
from . import BaseService

logger = logging.getLogger(__name__)


class UserService(BaseService):
    """Service des utilisateurs

    Args:
        BaseService (_type_):

    Returns:
        _type_: _description_
    """

    # Add user
    def add_user_to_db(self, user_data: UserCreate, db: Session):
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

        self.api_pastell.perform_patch(f"/utilisateur/{user_data.id_pastell}", {"password": user_data.pwd_pastell})

        return new_user

    def create_user_token(self, user: UserPastell, db: Session) -> UserPastell:
        """Crée un token Pastell (nom megacte_<login>) pour l'utilisateur.

        Réinitialise d'abord le mot de passe Pastell de l'utilisateur via le compte
        technique (PATCH /v2/utilisateur/{id_u}), puis crée le token via l'endpoint
        self-service POST /v2/utilisateur/token en s'authentifiant en Basic Auth avec
        le login et le mot de passe temporaire. Ce mot de passe temporaire n'est pas
        stocké en base : seul le token obtenu y est conservé (chiffré).

        Args:
            user (UserPastell): l'utilisateur concerné
            db (Session): la session de base de données

        Returns:
            UserPastell: l'utilisateur avec son token renseigné
        """
        token_name = f"megacte_{user.login}"
        temp_password = PasswordUtils.generate_password(15)

        # Réinitialiser le mot de passe Pastell via le compte technique
        self.api_pastell.perform_patch(f"/utilisateur/{user.id_pastell}", {"password": temp_password})

        # Créer le token utilisateur via Basic Auth login / mot de passe temporaire
        user_client = self.api_pastell.with_auth(HTTPBasicAuth(user.login, temp_password))
        response = user_client.perform_post("/utilisateur/token", data={"name": token_name})

        # Utiliser une clé Fernet valide pour chiffrer le token : la clé existante
        # (issue d'encrypt_password, en base64 "doublé") n'est pas au format attendu
        # par encrypt_with_key. Le mot de passe stocké devient de toute façon obsolète
        # après la réinitialisation : régénérer la clé ne casse rien.
        user.pwd_key = PasswordUtils.generate_fernet_key()
        user.token_name = token_name
        user.token = PasswordUtils.encrypt_with_key(response["token"], user.pwd_key)
        user.token_expires_at = None
        db.commit()
        db.refresh(user)
        logger.info(f"Token créé pour l'utilisateur {user.login}")
        return user

    # Delete User
    def delete_user_from_db(self, user_id: int, db: Session):
        db_user = db.query(UserPastell).filter(UserPastell.id == user_id).first()
        if not db_user:
            raise UserNotFoundException()

        db.delete(db_user)
        db.commit()

        return {"message": "User deleted successfully"}

    # Get user context
    def get_user_context_service(self, user: UserPastell) -> dict:
        """Récupère le contexte du user à partir de Pastell en utilisant le jeton Keycloak réceptionner côté API

        Args:
            user : L'utilisateur récupéré depuis la BD

        Raises:
            PastellException:  Si les infos du user ne peuvent pas être récupérées depuis Pastell.
            PastellException: Si les entités du user ne peuvent pas être récupérées depuis Pastell.

        Returns:
        dict: Un dictionnaire contenant les infos du user et ses entités.
        """

        # Récupérer les infos du user depuis Pastell
        user_info = self.api_pastell.get_user_by_id_u(user.id_pastell)

        # Récupérer les entités du user depuis Pastell
        user_entites = self.api_pastell.get_entite_with_child(only_active=True)

        return {"user_info": user_info, "entites": user_entites}
