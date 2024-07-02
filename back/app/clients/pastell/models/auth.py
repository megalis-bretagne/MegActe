from dataclasses import dataclass
from typing import Tuple


@dataclass
class AuthUser:
    """
    Contient les infos d'authentification API
    """

    login: str
    pwd: str

    def auth(self) -> Tuple:
        return (self.login, self.pwd)
