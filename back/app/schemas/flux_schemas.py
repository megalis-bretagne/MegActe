from pydantic import BaseModel, RootModel
from typing import Dict


class FluxModel(BaseModel):
    """Modèle représentant un flux.

    Attributes:
        type (str): Type de dossier associé à l'acte.
        nom (str): Nom de l'acte.
        enable (bool): Indique si l'acte est activé ou non.
    """

    type: str
    nom: str
    enable: bool


class FluxResponseModel(RootModel):
    """Modèle représentant la réponse contenant un dictionnaire de flux.

    Attributes:
        __root__ (Dict[str, FluxModel]): Un dictionnaire où les clés sont les noms des actes
        et les valeurs sont des instances de `ActeModel`.
    """

    __pydantic_root_model__: Dict[str, FluxModel]
