from fastapi import APIRouter, Depends
from ..clients.pastell.api import ApiPastell
from . import get_or_make_api_pastell
from ..services.flux_service import get_flux_detail_service

router = APIRouter()


# Get detail form document
@router.get("/flux/{flux_type}", tags=["flux"])
def get_flux_detail(
    flux_type: str, client: ApiPastell = Depends(get_or_make_api_pastell)
):
    return get_flux_detail_service(client, flux_type)
