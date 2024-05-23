from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.fernet import Fernet
import base64, os
import requests
from app.configuration import read_config
from ..exceptions.custom_exceptions import PastellException


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
