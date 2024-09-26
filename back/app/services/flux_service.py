from sqlalchemy import select

from ..schemas.flux_schemas import FluxResponseModel
from ..models.flux import FluxAvailable
from ..database import SessionLocal
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


def get_flux(client_api: ApiPastell) -> FluxResponseModel:
    flux = client_api.perform_get("/flux")

    with SessionLocal.begin() as db:
        flux_enable = (
            db.execute(
                select(FluxAvailable.flux_id_pastell).where(
                    FluxAvailable.enable == True
                )
            )
            .scalars()
            .all()
        )
    for flux_id, value in flux.items():
        value["enable"] = flux_id in flux_enable

    return flux
