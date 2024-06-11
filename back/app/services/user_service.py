from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.fernet import Fernet
import base64, os
import requests
from app.configuration import read_config
from ..exceptions.custom_exceptions import PastellException
from sqlalchemy.orm import Session

from ..schemas.user_schemas import UserCreate, UserInfo
from ..schemas.entite_schemas import EntiteInfo

from ..exceptions.custom_exceptions import (
    UserNotFoundException,
    DecryptionException,
    UserRegistrationException,
)
from ..models.users import UserPastell
from ..logging_config import logger


def generate_key(password: str) -> bytes:
    try:
        salt = os.urandom(16)
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=480000,  # Un nombre élevé d'itérations pour renforcer la sécurité
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        logger.debug("Key generated successfully")

        return key
    except Exception as e:
        logger.error(f"An error occurred while generating the key: {str(e)}")
        raise


def encrypt_password(password: str, key: bytes) -> bytes:
    try:
        fernet = Fernet(key)
        encrypted_password = fernet.encrypt(password.encode())
        return encrypted_password.decode("utf-8")
    except Exception as e:
        logger.error(f"An error occurred while encrypting the password: {str(e)}")
        raise


def decrypt_password(encrypted_password: str, key: bytes) -> str:
    try:
        fernet = Fernet(key)
        decrypted_password = fernet.decrypt(encrypted_password.encode("utf-8")).decode()
        return decrypted_password

    except Exception as e:
        logger.error(f"An error occurred while decrypting the password: {str(e)}")
        raise


def send_password_to_pastell(id_pastell: int, password: str):
    config = read_config("config/config.yml")
    url = f"{config['PASTELL']['URL']}/utilisateur/{id_pastell}"
    data = {"password": password}
    response = requests.patch(
        url, data=data, auth=(config["PASTELL"]["USER"], config["PASTELL"]["PASSWORD"])
    )
    if response.status_code != 200:
        raise PastellException(
            status_code=response.status_code,
            detail="Failed to update password in Pastell",
        )


# Get liste de tous les users
def get_all_users_from_db(db: Session):
    try:
        users = db.query(UserPastell).all()
        return users
    except Exception as e:
        logger.error(f"An error occurred while fetching users: {str(e)}")
        raise


# Get user by id
def get_user_by_id_from_db(user_id: int, db: Session):
    try:
        db_user = db.query(UserPastell).filter(UserPastell.id == user_id).first()
        if db_user is None:
            raise UserNotFoundException()
        return db_user

    except Exception as e:
        logger.error(f"An error occurred while fetching user by ID {user_id}: {str(e)}")
        raise


# Add user
def add_user_to_db(user_data: UserCreate, db: Session):
    """Ajouter un nouvel utilisateur dans la BD et envoyer le mot de passe non chifré à PASTELL

    Args:
        user_data (UserCreate): Les données du user à ajouter.
        db (Session, optional): La session de base de données. Defaults to Depends(get_db).

    Returns:
        UserPastell: L'utilisateur nouvellement créé.
    """
    # Chiffrer le pwd
    key = generate_key(user_data.pwd_pastell)
    encrypted_pwd = encrypt_password(user_data.pwd_pastell, key)

    # Enregistrer l'user dans la BD
    new_user = UserPastell(
        login=user_data.login,
        id_pastell=user_data.id_pastell,
        pwd_pastell=encrypted_pwd,
        pwd_key=base64.urlsafe_b64encode(key).decode("utf-8"),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    if new_user.id is None:
        raise UserRegistrationException("Failed to register the user in the database")

    # Envoyer le pwd non chifré à PASTELL

    send_password_to_pastell(user_data.id_pastell, user_data.pwd_pastell)

    return new_user


# Récupérer un pwd chiffré et le déchiffrer
def get_decrypted_password_from_db(user_id: int, db: Session):
    user = db.query(UserPastell).filter(UserPastell.id == user_id).first()
    if not user:
        raise UserNotFoundException()
    key = base64.urlsafe_b64decode(user.pwd_key.encode("utf-8"))
    try:
        decrypted_password = decrypt_password(user.pwd_pastell, key)
        return {"decrypted_password": decrypted_password}
    except Exception:
        raise DecryptionException()


# Update User
def update_user_in_db(user_id: int, user_data: UserCreate, db: Session):
    db_user = db.query(UserPastell).filter(UserPastell.id == user_id).first()
    if not db_user:
        raise UserNotFoundException()

    db_user.login = user_data.login
    db_user.id_pastell = user_data.id_pastell
    db.commit()
    db.refresh(db_user)

    return db_user


# Delete User
def delete_user_from_db(user_id: int, db: Session):
    db_user = db.query(UserPastell).filter(UserPastell.id == user_id).first()
    if not db_user:
        raise UserNotFoundException()

    db.delete(db_user)
    db.commit()

    return {"message": "User deleted successfully"}


def get_pastell_auth(user: UserPastell):
    """Récupère les infos d'authentification pour l'utilisateur de Pastell.

    Cette fonction utilise le login du user et déchiffre son mdp pour générer les infors d'authentification nécessaires aux requêtes HTTP vers Pastell.

    Args:
        user (UserPastell): L'objet user contenant le login, le mdp chiffré et la clé de chiffrement.

    Returns:
        tuple: Un tuple contenant le login du user et son mdp déchiffré.
    """
    return (
        user.login,
        decrypt_password(
            user.pwd_pastell, base64.urlsafe_b64decode(user.pwd_key.encode("utf-8"))
        ),
    )


# Get user context
def get_user_context_service(user):
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
    config = read_config("config/config.yml")
    timeout = config.get("TIMEOUT")

    user_info_url = f"{config['PASTELL']['URL']}/utilisateur/{user.id_pastell}"
    user_info_response = requests.get(
        user_info_url,
        auth=get_pastell_auth(user),
        timeout=timeout,
    )
    if user_info_response.status_code != 200:
        raise PastellException(
            status_code=user_info_response.status_code,
            detail="Failed to retrieve user info from Pastell",
        )

    user_info_data = user_info_response.json()

    if "certificat" not in user_info_data or not isinstance(
        user_info_data["certificat"], list
    ):
        user_info_data["certificat"] = []

    user_info = UserInfo(**user_info_data)

    if user_info.id_e == 0:
        return {"user_info": user_info}

    # Récupérer les entités du user depuis Pastell
    entites_url = f"{config['PASTELL']['URL']}/entite/"
    entites_response = requests.get(
        entites_url,
        auth=get_pastell_auth(user),
        timeout=timeout,
    )
    if entites_response.status_code != 200:
        raise PastellException(
            status_code=entites_response.status_code,
            detail="Failed to retrieve user entities from Pastell",
        )

    entites_data = entites_response.json()

    # Convertir les données des entités en objets EntiteInfo
    user_entites = [EntiteInfo(**entite) for entite in entites_data]

    return {"user_info": user_info, "entites": user_entites}


# Get liste des flux dispo pour l'utilisateur connecté
def get_user_flux_service(user):
    """Récupère les flux disponibles pour l'utilisateur depuis Pastell

    Args:
        user: L'utilisateur pour lequel les flux doivent être récupérés.

    Raises:
        PastellException:  Si les flux du user ne peuvent pas être récupérées depuis Pastell.

    Returns:
       list: Une liste contenant les flux disponibles pour l'utilisateur.
    """

    # Récupérer les infos du user depuis Pastell
    config = read_config("config/config.yml")
    timeout = config.get("TIMEOUT")

    flux_url = f"{config['PASTELL']['URL']}/flux"
    flux_response = requests.get(
        flux_url,
        auth=get_pastell_auth(user),
        timeout=timeout,
    )

    if flux_response.status_code != 200:
        raise PastellException(
            status_code=flux_response.status_code,
            detail="Failed to retrieve flux from Pastell",
        )

    return flux_response.json()
