from ..clients.pastell.api import ApiPastell


def get_flux_detail_service(client_api: ApiPastell, flux_type: str):
    """Récupère le détail d'un flux (formulaire) depuis Pastell en utilisant le type de flux fourni.

    Args:
        client_api (ApiPastell) : client api pastell
        flux_type (str): Le type de flux à récupérer.

    Raises:
        PastellException: Si les détails du flux ne peuvent pas être récupérés depuis Pastell.

    Returns:
       dict: Un dictionnaire contenant les détails du flux.
    """
    flux_detail_url = client_api.perform_get(f"flux/{flux_type}")

    return flux_detail_url
