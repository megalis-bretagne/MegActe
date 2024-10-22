import pathlib
from typing import Tuple, Type
from pydantic import BaseModel, computed_field
from pydantic_settings import (
    BaseSettings,
    PydanticBaseSettingsSource,
    SettingsConfigDict,
    YamlConfigSettingsSource,
)


class S2low(BaseModel):
    """
    Configuration pour la connexion à s2low

    Attributes:
        url     url api s2low
        path_certificate    le chemin du certificat (format .pem)
        path_key    le chemin de la clé du certificat (format .pem)
    """

    url: str
    path_certificate: str
    path_key: str


class DocumentConfig(BaseModel):
    """
    Configuration pour les documents de pastell

    Args:
        BaseModel (_type_):
    """

    # La liste des external Data à récupérer au get des Documents
    external_data_to_retrieve: list[str] = ["type_piece_fichier"]


class Pastell(BaseModel):
    """
    Configuration pour la connexion pastell

    Args:
        BaseModel (_type_):
    """

    url: str
    user: str
    password: str


class Keycloak(BaseModel):
    """
    Configuration pour la connexion keycloak

    Args:
        BaseModel (_type_):
    """

    token_url: str
    refresh_url: str
    auth_url: str
    jwks_url: str
    client_id: str = "megacte"


class Database(BaseModel):
    """
    Configuration de la connexion à la BDD

    Args:
        BaseModel (_type_):
    """

    type: str = "postgresql"
    pwd: str
    user: str
    host: str
    port: int
    database: str

    @computed_field
    def database_url(self) -> str:
        """
        Retourne l'url complète de la connexion à la base de données

        Returns:
            str: l'url
        """
        return f"{self.type}://{self.user}:{self.pwd}@{self.host}:{self.port}/{self.database}"


class Settings(BaseSettings):
    """
    Les settings de l'applicatoion

    Args:
        BaseSettings (_type_):
    """

    document: DocumentConfig = DocumentConfig()
    pastell: Pastell
    s2low: S2low
    keycloak: Keycloak
    database: Database
    request_timeout: int = 5
    log_level: str = "INFO"  # ["debug", "info", "warning", "error", "critical"],

    if pathlib.Path("config/configd.yml").is_file():
        model_config = SettingsConfigDict(
            yaml_file="config/config.yml", case_sensitive=False
        )
    else:
        model_config = SettingsConfigDict(
            yaml_file="config/config_template.yml", case_sensitive=False
        )

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls: Type[BaseSettings],
        init_settings: PydanticBaseSettingsSource,
        env_settings: PydanticBaseSettingsSource,
        dotenv_settings: PydanticBaseSettingsSource,
        file_secret_settings: PydanticBaseSettingsSource,
    ) -> Tuple[PydanticBaseSettingsSource, ...]:
        return (YamlConfigSettingsSource(settings_cls),)
