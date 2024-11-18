from pydantic import BaseModel

from ..clients.pastell.models.user_info import UserInfo


class UserCreate(BaseModel):
    """
    Modèle pour la création d'un utilisateur dans la BDD Megacte.

    Attributes:
        login (str): Le login de l'utilisateur.
        id_pastell (int): L'ID de l'utilisateur dans Pastell.
        pwd_pastell (str): Le mot de passe de l'utilisateur dans Pastell.
    """

    login: str
    id_pastell: int
    pwd_pastell: str
