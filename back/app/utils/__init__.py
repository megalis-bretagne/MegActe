from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.fernet import Fernet, InvalidToken
import base64
import os


from ..exceptions.custom_exceptions import DecryptionException


class PasswordUtils:
    """Contient les méthodes utilitaire pour encrypted decrypter les mdp"""

    @staticmethod
    def decrypt_password(password: str, key: str) -> str:
        try:
            fernet = Fernet(base64.urlsafe_b64decode(key.encode("utf-8")))
            return fernet.decrypt(password.encode("utf-8")).decode()
        except Exception as e:
            raise DecryptionException

    @staticmethod
    def encrypt_password(password: str) -> tuple:
        """Encrypte un mot de passe et retourne ca clé et le mdp encrypté

        Args:
            password (str): le mot de passe non crypté

        Returns:
            tuple: (key , password cyrpted)
        """
        salt = os.urandom(16)
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=480000,  # Un nombre élevé d'itérations pour renforcer la sécurité
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))

        fernet = Fernet(key)
        encrypted_password = fernet.encrypt(password.encode())
        return (
            base64.urlsafe_b64encode(key).decode("utf-8"),
            encrypted_password.decode("utf-8"),
        )
