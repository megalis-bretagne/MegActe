from functools import lru_cache
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2AuthorizationCodeBearer
import jwt
from config.configuration import Settings


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
import logging

logging.basicConfig(
    level=settings.log_level,
    format="%(asctime)s.%(msecs)03d : %(levelname)s : %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    force=True,
)


oauth_2_scheme = OAuth2AuthorizationCodeBearer(
    tokenUrl=settings.keycloak.token_url,
    authorizationUrl=settings.keycloak.auth_url,
    refreshUrl=settings.keycloak.refresh_url,
)


def validate_token(
    token: str = Depends(oauth_2_scheme),
    settings: Settings = Depends(get_settings),
):
    """
        Valide un token JWT en utilisant les clés publiques de Keycloak et retourne le payload décodé.

    Args:
        token (str, optional): Le token jwt à valider
    Raises:
        HTTPException: _description_

    Returns:
        dict: La payload decodé
    """
    jwks_client = jwt.PyJWKClient(settings.keycloak.jwks_url)
    signing_key = jwks_client.get_signing_key_from_jwt(token)
    try:
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=settings.keycloak.client_id,
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )


# Fonction pour obtenir les informations de l'utilisateur à partir du payload decodé
def get_current_user(payload: dict = Depends(validate_token)) -> str:
    """
    Extrait le login du token

    Args:
        payload (dict): Le payload décodé du token JWT, fourni automatiquement via la dépendance `validate_token`.

    Returns:
        str: le login
    """
    return payload.get("preferred_username")
