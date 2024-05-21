from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.fernet import Fernet
import base64, os


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


# Vérifier si un pwd donné correspond au pwd chiffré.
# def verify_password(encrypted_password: str, salt: bytes, password: str) -> bool:
#     key = generate_key(password, salt)
#     fernet = Fernet(key)
#     try:
#         decrypted_password = fernet.decrypt(encrypted_password.encode("utf-8")).decode()
#         return decrypted_password == password
#     except:
#         return False