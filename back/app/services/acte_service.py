import requests
from app.configuration import read_config
from ..exceptions.custom_exceptions import PastellException

from .user_service import get_pastell_auth


def get_acte_form_detail(flux_type: str, user):
    """Récupère le détail d'un flux (formulaire) depuis Pastell en utilisant le type de flux fourni.

    Args:
        flux_type (str): Le type de flux à récupérer.
        user (UserPastell): L'utilisateur pour lequel les infos doivent être récupérées.

    Raises:
        PastellException: Si les détails du flux ne peuvent pas être récupérés depuis Pastell.

    Returns:
       dict: Un dictionnaire contenant les détails du flux.
    """
    config = read_config("config/config.yml")
    timeout = config.get("TIMEOUT")

    flux_detail_url = f"{config['PASTELL']['URL']}/flux/{flux_type}"
    response = requests.get(
        flux_detail_url,
        auth=get_pastell_auth(user),
        timeout=timeout,
    )

    if response.status_code != 200:
        raise PastellException(
            status_code=response.status_code,
            detail="Failed to retrieve flux detail from Pastell",
        )

    return response.json()
