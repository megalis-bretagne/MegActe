from pydantic import BaseModel


class ConnecteurCreateAuthTdt(BaseModel):
    """
    Modèle pour la création d'une config de connecteur tdt

    Attributes:
        id_e  (int) l'id de l'entité
        flux (str) le nom du flux du connecteur associé
        login_tech_tdt (str) le login technique du connecteur
        pwd_tech_tdt (str) le mot de passe en clair
    """

    id_e: int
    flux: str
    login_tech_tdt: str
    pwd_tech_tdt: str
