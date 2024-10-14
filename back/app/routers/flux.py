from fastapi import APIRouter, Depends
from ..clients.pastell.api import ApiPastell
from ..services import get_or_make_api_pastell
from ..services.flux_service import FluxService
import logging

router = APIRouter()

logger = logging.getLogger(__name__)


# Get detail form document
@router.get("/flux/{flux_type}", tags=["flux"])
def get_flux_detail(
    flux_type: str, client: ApiPastell = Depends(get_or_make_api_pastell)
):
    logging.debug("call get_flux_detail")
    return FluxService(client).get_flux_detail_service(flux_type)
