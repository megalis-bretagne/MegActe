from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..clients.pastell.api import ApiPastell
from ..clients.pastell.api.entite_api import EntiteApi
from ..database import get_db, get_user_from_db
from ..dependencies import settings
from ..exceptions.custom_exceptions import UserNotAdminException
from ..models.users import UserPastell
from ..schemas.flux_schemas import FluxResponseModel
from ..schemas.user_schemas import UserCreate
from ..services import (
    get_client_api_pastell,
    get_or_make_api_pastell,
    get_or_make_api_pastell_for_admin,
)
from ..services.flux_service import FluxService
from ..services.sync_service import SyncUserService
from ..services.user_service import UserService

router = APIRouter()

entite_api_dependency = get_client_api_pastell(EntiteApi)


# Get infos user connecté
@router.get(
    "/user",
    tags=["users"],
    description="Récupère les informations de l'utilisateur connecté",
)
def get_user(
    user: UserPastell = Depends(get_user_from_db),
    client: ApiPastell = Depends(entite_api_dependency),
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
def get_user_flux_available(only_enable: bool = True, client: ApiPastell = Depends(get_or_make_api_pastell)):
    return FluxService(client).get_flux(only_enable)


# Synchronisation manuelle des utilisateurs Pastell vers la BDD Megacte
@router.post(
    "/users/refresh",
    tags=["users"],
    description="Déclenche la synchronisation des utilisateurs Pastell. Réservé à l'admin Pastell.",
)
def refresh_users(
    current_user: UserPastell = Depends(get_user_from_db),
    db: Session = Depends(get_db),
    client_admin: ApiPastell = Depends(get_or_make_api_pastell_for_admin),
):
    if current_user.login != settings.pastell.user:
        raise UserNotAdminException()
    count = SyncUserService(client_admin).sync_users(db)
    return {"message": f"Synchronisation terminée : {count} utilisateurs actifs"}
