from fastapi import APIRouter, Depends, status

from ..services.connecteur_service import ConnecteurTdtService
from ..schemas.connecteur_schemas import ConnecteurCreateAuthTdt
from ..database import get_db


router = APIRouter()


@router.get("/health", tags=["health"])
def health():
    return {"MegActe Works !"}


# Add user
@router.post(
    "/connecteur-tdt", tags=["connecteurs"], status_code=status.HTTP_201_CREATED
)
def add_connecteur_tdt(connecteur: ConnecteurCreateAuthTdt, db=Depends(get_db)):
    return ConnecteurTdtService().create(connecteur, db)
