from fastapi import APIRouter, Depends
from ..database import get_user_from_db
from ..services.flux_service import get_flux_detail_service
from ..models.users import UserPastell

router = APIRouter()


# Get detail form document
@router.get("/flux/{flux_type}", tags=["flux"])
def get_flux_detail(flux_type: str, user: UserPastell = Depends(get_user_from_db)):
    return get_flux_detail_service(flux_type, user)
