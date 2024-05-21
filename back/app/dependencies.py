from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2AuthorizationCodeBearer
import jwt
import yaml


def read_config(config_file):
    """
    Lis la config du fichier yaml

    Args:
        config_file (_type_): Le fichier de config

    Returns:
        dic: la liste des configuration
    """
    try:
        with open(config_file) as yamlfile:
            config_data = yaml.safe_load(yamlfile)
    except Exception:
        config_data = {}
    # Load common settings
    return config_data


config = read_config("config/config.yml")
oauth_2_scheme = OAuth2AuthorizationCodeBearer(
    tokenUrl=config["KEYCLOAK"]["token_url"],
    authorizationUrl=config["KEYCLOAK"]["auth_url"],
    refreshUrl=config["KEYCLOAK"]["refresh_url"],
)


def validate_token(token: str = Depends(oauth_2_scheme)):
    """
        Valide un token JWT en utilisant les clés publiques de Keycloak et retourne le payload décodé.

    Args:
        token (str, optional): Le token jwt à valider
    Raises:
        HTTPException: _description_

    Returns:
        dict: La payload decodé
    """

    jwks_client = jwt.PyJWKClient(config["KEYCLOAK"]["jwks_url"])
    signing_key = jwks_client.get_signing_key_from_jwt(token)
    try:
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=config["KEYCLOAK"]["client_id"],
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )


# Fonction pour obtenir les informations de l'utilisateur à partir du payload decodé
def get_current_user(payload: dict = Depends(validate_token)):
    """
    Extrait les informations de l'utilisateur à partir du payload décodé du token JWT.

    Args:
        payload (dict): Le payload décodé du token JWT, fourni automatiquement via la dépendance `validate_token`.

    Returns:
        dict: Un dictionnaire contenant les informations de l'utilisateur, notamment l'email et le nom d'utilisateur.
    """

    user_info = {
        "login": payload.get("email"),
        "username": payload.get("preferred_username"),
    }
    return user_info
