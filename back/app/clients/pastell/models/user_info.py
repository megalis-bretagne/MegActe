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
    """

    id_u: int
    login: str
    nom: str
    prenom: str
    email: str
    id_e: int

    @field_validator("id_u", "id_e", mode="before")
    def parse_int(cls, v: str):
        """
        Valide et convertit les valeurs des champs 'id_u' et 'id_e' en entiers.

        Args:
            v (str): La valeur à convertir.

        Returns:
            int: La valeur convertie en entier.
        """
        return int(v)

        # if "certificat" not in user_info_data or not isinstance(

    #     user_info_data["certificat"], list
    # ):
    #     user_info_data["certificat"] = []
