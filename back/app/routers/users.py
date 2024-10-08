from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..schemas.flux_schemas import FluxResponseModel
from ..services.flux_service import FluxService

from ..clients.pastell.api.entite_api import EntiteApi

from . import (
    get_client_api_pastell,
    get_or_make_api_pastell,
    get_or_make_api_pastell_for_admin,
)
from ..clients.pastell.api import ApiPastell
from ..database import get_db, get_user_from_db
from ..schemas.user_schemas import UserCreate
from ..services.user_service import UserService
from ..models.users import UserPastell

router = APIRouter()


# Get infos user connecté
@router.get(
    "/user",
    tags=["users"],
    response_model=dict,
    description="Récupère les informations de l'utilisateur connecté",
)
def get_user(
    user: UserPastell = Depends(get_user_from_db),
    client: ApiPastell = Depends(get_client_api_pastell(EntiteApi)),
):
    return UserService(client).get_user_context_service(user)


# Add user
@router.post("/user", response_model=UserCreate, tags=["users"])
def add_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    client_admin: ApiPastell = Depends(get_or_make_api_pastell_for_admin),
):
    return UserService(client_admin).add_user_to_db(user_data, db)


# Get liste des flux dispo pour l'utilisateur connecté
@router.get(
    "/user/flux",
    tags=["users"],
    description="Récupère les flux de l'utilisateur connecté.",
    response_model=FluxResponseModel,
)
def get_user_flux_available(client: ApiPastell = Depends(get_or_make_api_pastell)):
    return FluxService(client).get_flux()
