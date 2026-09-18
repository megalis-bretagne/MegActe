from pydantic import BaseModel, field_validator


class UserInfo(BaseModel):
    """
    Modèle pour les informations d'un utilisateur dans PASTELL.

    Attributes:
        id_u (int): L'ID de l'utilisateur.
        login (str): Le login de l'utilisateur.
        nom (str): Le nom de l'utilisateur.
        prenom (str): Le prénom de l'utilisateur.
        email (str): L'adresse email de l'utilisateur.
        certificat (list[str]): La liste des certificats de l'utilisateur.
        id_e (int): L'ID de l'entité associée à l'utilisateur.
        active (bool): Si l'utilisateur est actif.
    """

    id_u: int
    login: str
    nom: str | None = None
    prenom: str | None = None
    email: str | None = None
    id_e: int | None = None
    active: bool = True

    @field_validator("id_u", "id_e", mode="before")
    def parse_int(cls, v):
        """
        Valide et convertit les valeurs des champs 'id_u' et 'id_e' en entiers.

        Args:
            v (str): La valeur à convertir.

        Returns:
            int: La valeur convertie en entier (ou None si absente).
        """
        if v is None:
            return None
        return int(v)
