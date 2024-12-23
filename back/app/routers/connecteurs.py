from fastapi import APIRouter, status

from ..services.connecteur_service import ConnecteurTdtService
from ..schemas.connecteur_schemas import ConnecteurCreateAuthTdt


router = APIRouter()


# Add user
@router.post("/connecteur-tdt", tags=["connecteurs"], status_code=status.HTTP_201_CREATED)
def add_connecteur_tdt(connecteur: ConnecteurCreateAuthTdt):
    return ConnecteurTdtService().create(connecteur)
