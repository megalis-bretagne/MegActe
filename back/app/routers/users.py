from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from ..clients.pastell.api import ApiPastell
from ..clients.pastell.api.entite_api import EntiteApi
from ..database import get_db, get_user_from_db
from ..dependencies import require_admin
from ..models.users import UserPastell
from ..schemas.flux_schemas import FluxResponseModel
from ..schemas.user_schemas import UserCreate
from ..services import (
    get_client_api_pastell,
    get_or_make_api_pastell,
)
from ..services.flux_service import FluxService
from ..services.sync_service import run_sync_users_job
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


# Add user — réservé aux comptes ayant le rôle admin Keycloak
@router.post("/user", response_model=UserCreate, tags=["users"])
def add_user(
    user_data: UserCreate,
    payload: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return UserService().add_user_to_db(user_data, db)


# Get liste des flux dispo pour l'utilisateur connecté
@router.get(
    "/user/flux",
    tags=["users"],
    description="Récupère les flux de l'utilisateur connecté.",
    response_model=FluxResponseModel,
)
def get_user_flux_available(only_enable: bool = True, client: ApiPastell = Depends(get_or_make_api_pastell)):
    return FluxService(client).get_flux(only_enable)


# Synchronisation manuelle des utilisateurs Pastell vers la BDD Megacte.
# Réservée aux comptes ayant le rôle admin Keycloak (utilisateur ou service account).
# Réponse immédiate : la synchro s'exécute en arrière-plan (tâche de fond),
# afin de ne pas bloquer l'appelant (scripts de synchronisation).
@router.post(
    "/users/refresh",
    tags=["users"],
    description=(
        "Déclenche la synchronisation des utilisateurs Pastell (asynchrone) et renvoie "
        "un accusé de réception immédiat. Réservé aux comptes admin Keycloak."
    ),
)
def refresh_users(
    payload: dict = Depends(require_admin),
    background_tasks: BackgroundTasks = BackgroundTasks,
):
    background_tasks.add_task(run_sync_users_job)
    return {"message": "Synchronisation des utilisateurs lancée en arrière-plan"}
