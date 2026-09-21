import base64
import os
import secrets
import string

import requests.auth
from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from ..exceptions.custom_exceptions import DecryptionException


class BearerAuth(requests.auth.AuthBase):
    """Authentification Bearer Token pour les appels API Pastell."""

    def __init__(self, token: str):
        self.token = token

    def __call__(self, r):
        r.headers["Authorization"] = f"Bearer {self.token}"
        return r


class PasswordUtils:
    """Contient les méthodes utilitaire pour chiffrer/déchiffrer les mdp et tokens"""

    @staticmethod
    def generate_fernet_key() -> str:
        """Génère une clé Fernet aléatoire et la retourne sous forme de chaîne."""
        return Fernet.generate_key().decode("utf-8")

    @staticmethod
    def encrypt_with_key(data: str, key: str) -> str:
        """Chiffre des données avec une clé Fernet existante."""
        fernet = Fernet(key.encode("utf-8"))
        return fernet.encrypt(data.encode("utf-8")).decode("utf-8")

    @staticmethod
    def decrypt_with_key(data: str, key: str) -> str:
        """Déchiffre des données avec une clé Fernet existante."""
        try:
            fernet = Fernet(key.encode("utf-8"))
            return fernet.decrypt(data.encode("utf-8")).decode("utf-8")
        except (TypeError, ValueError, InvalidToken):
            raise DecryptionException

    @staticmethod
    def decrypt_password(password: str, key: str) -> str:
        try:
            fernet = Fernet(base64.urlsafe_b64decode(key.encode("utf-8")))
            return fernet.decrypt(password.encode("utf-8")).decode()
        except (TypeError, ValueError, InvalidToken):
            raise DecryptionException

    SPECIAL_CHARS = "!@#$%&*"

    @staticmethod
    def generate_password(length: int = 15) -> str:
        """Génère un mot de passe aléatoire conforme à la politique Pastell.

        Le mot de passe contient au moins un caractère minuscule, un caractère
        majuscule, un chiffre et trois caractères spéciaux parmi !@#$%&*.
        """
        if length < 6:
            raise ValueError("length doit être >= 6")
        lowercase = string.ascii_lowercase
        uppercase = string.ascii_uppercase
        digits = string.digits
        guaranteed = [
            secrets.choice(lowercase),
            secrets.choice(uppercase),
            secrets.choice(digits),
            secrets.choice(PasswordUtils.SPECIAL_CHARS),
            secrets.choice(PasswordUtils.SPECIAL_CHARS),
            secrets.choice(PasswordUtils.SPECIAL_CHARS),
        ]
        all_chars = lowercase + uppercase + digits + PasswordUtils.SPECIAL_CHARS
        chars = guaranteed + [secrets.choice(all_chars) for _ in range(length - len(guaranteed))]
        secrets.SystemRandom().shuffle(chars)
        return "".join(chars)

    @staticmethod
    def encrypt_password(password: str) -> tuple:
        """Chiffre un mot de passe et retourne sa clé et le mdp chiffré."""
        salt = os.urandom(16)
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=480000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))

        fernet = Fernet(key)
        encrypted_password = fernet.encrypt(password.encode())
        return (
            base64.urlsafe_b64encode(key).decode("utf-8"),
            encrypted_password.decode("utf-8"),
        )
