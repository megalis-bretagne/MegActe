from fastapi import APIRouter, Depends
from ..database import get_user_from_db
from ..services.acte_service import get_acte_form_detail
from ..models.users import UserPastell

router = APIRouter()


# Get detail form acte
@router.get("/flux/{flux_type}", tags=["flux"])
def get_flux_detail(flux_type: str, user: UserPastell = Depends(get_user_from_db)):
    return get_acte_form_detail(flux_type, user)
