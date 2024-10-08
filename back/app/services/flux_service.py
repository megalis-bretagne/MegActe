from sqlalchemy import select
from . import BaseService
from ..schemas.flux_schemas import FluxResponseModel
from ..models.flux import FluxAvailable
from ..database import SessionLocal


class FluxService(BaseService):
    """
    Service associé au flux

    Args:
        BaseService (_type_):
    """

    def get_flux_detail_service(self, flux_type: str):
        """Récupère le détail d'un flux (formulaire) depuis Pastell en utilisant le type de flux fourni.

        Args:
            flux_type (str): Le type de flux à récupérer.

        Raises:
            PastellException: Si les détails du flux ne peuvent pas être récupérés depuis Pastell.

        Returns:
        dict: Un dictionnaire contenant les détails du flux.
        """
        flux_detail = self.api_pastell.perform_get(f"flux/{flux_type}")

        return flux_detail

    def get_flux(self) -> FluxResponseModel:
        flux = self.api_pastell.perform_get("/flux")

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
