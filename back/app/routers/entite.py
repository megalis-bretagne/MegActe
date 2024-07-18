from fastapi import APIRouter, Depends, Query
from typing import Annotated
from typing import Dict


from ..services.document_service import list_documents_paginate

from ..clients.pastell.api import ApiPastell
from ..routers import get_or_make_api_pastell


router = APIRouter()


# retourne la liste de documents d'une entité
@router.get(
    "/entite/{id_e}/documents",
    tags=["document"],
    description="Retourne la liste des documents d'une entités",
)
def get_documents_on_entite(
    id_e: int,
    type_flux: Annotated[
        str | None,
        Query(
            title="Le type de flux",
            description="Filtrer par type de flux",
        ),
    ] = None,
    offset: int = 0,
    limit: int = 100,
    client: ApiPastell = Depends(get_or_make_api_pastell),
):
    args = {}

    return list_documents_paginate(client, id_e, type_flux, *(offset, limit), **args)
