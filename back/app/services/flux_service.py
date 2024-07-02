import requests

from ..dependencies import settings
from ..exceptions.custom_exceptions import PastellException

from .user_service import get_pastell_auth
from ..models.users import UserPastell


def get_flux_detail_service(flux_type: str, user: UserPastell):
    """Récupère le détail d'un flux (formulaire) depuis Pastell en utilisant le type de flux fourni.

    Args:
        flux_type (str): Le type de flux à récupérer.
        user (UserPastell): L'utilisateur pour lequel les infos doivent être récupérées.

    Raises:
        PastellException: Si les détails du flux ne peuvent pas être récupérés depuis Pastell.

    Returns:
       dict: Un dictionnaire contenant les détails du flux.
    """
    flux_detail_url = f"{settings.pastell.url}/flux/{flux_type}"
    response = requests.get(
        flux_detail_url,
        auth=get_pastell_auth(user),
        timeout=settings.request_timeout,
    )

    if response.status_code != 200:
        raise PastellException(
            status_code=response.status_code,
            detail="Failed to retrieve flux detail from Pastell",
        )

    return response.json()
