from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.fernet import Fernet
import base64, os
import requests
from app.configuration import read_config
from ..exceptions.custom_exceptions import PastellException
from sqlalchemy.orm import Session
from sqlalchemy.orm import Session

from ..schemas.user_schemas import UserCreate
from ..exceptions.custom_exceptions import (
    UserNotFoundException,
    DecryptionException,
)
from ..models.users import UserPastell


def generate_key(password: str) -> bytes:
    salt = os.urandom(16)
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=480000,  # Un nombre élevé d'itérations pour renforcer la sécurité
    )
    key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
    return key


def encrypt_password(password: str, key: bytes) -> bytes:
    fernet = Fernet(key)
    encrypted_password = fernet.encrypt(password.encode())
    return encrypted_password.decode("utf-8")


def decrypt_password(encrypted_password: str, key: bytes) -> str:
    fernet = Fernet(key)
    decrypted_password = fernet.decrypt(encrypted_password.encode("utf-8")).decode()
    return decrypted_password


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
    users = db.query(UserPastell).all()
    return users


# Get user by id
def get_user_by_id_from_db(user_id: int, db: Session):
    db_user = db.query(UserPastell).filter(UserPastell.id == user_id).first()
    if db_user is None:
        raise UserNotFoundException()
    return db_user


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

    new_user = UserPastell(
        login=user_data.login,
        id_pastell=user_data.id_pastell,
        pwd_pastell=encrypted_pwd,
        pwd_key=base64.urlsafe_b64encode(key).decode("utf-8"),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

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
