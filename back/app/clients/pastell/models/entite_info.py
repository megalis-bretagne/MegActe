from typing import List, Optional
from pydantic import BaseModel, field_validator


class EntiteInfo(BaseModel):
    """
    Modèle pour les informations d'une entité.

    Attributes:
        id_e (int): L'ID de l'entité.
        denomination (str): La dénomination de l'entité.
        siren (str): Le numéro SIREN de l'entité.
        type (str): Le type de l'entité.
        entite_mere (int): L'ID de l'entité mère.
        centre_de_gestion (str): Le centre de gestion de l'entité.
    """

    id_e: int
    denomination: str
    siren: str
    type: str
    entite_mere: int
    centre_de_gestion: str
    is_active: Optional[bool] = True

    @field_validator("id_e", "entite_mere", mode="before")
    def parse_int(cls, v: str):
        """
        Valide et convertit les valeurs des champs 'id_e' et 'entite_mere' en entiers.

        Args:
            v (str): La valeur à convertir.

        Returns:
            int: La valeur convertie en entier.
        """
        return int(v)


class EntiteInfoWithChild(EntiteInfo):
    """Liste des entite avec les enfants

    Args:
        EntiteInfo (_type_): _description_
    """

    child: Optional[List["EntiteInfoWithChild"]] = []
