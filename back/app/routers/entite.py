from fastapi import APIRouter, Depends, Query
from typing import Annotated

from ..schemas.pagination import ResponsePagination
from ..schemas.document_schemas import DocumentPaginate
from ..services.document_service import DocumentService

from ..clients.pastell.api import ApiPastell
from ..routers import get_or_make_api_pastell


router = APIRouter()


# retourne la liste de documents d'une entité
@router.get(
    "/entite/{id_e}/documents",
    tags=["document"],
    response_model=DocumentPaginate,
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

    docs = DocumentService(client).list_documents_paginate(
        id_e, type_flux, *(offset, limit), **args
    )
    count = client.count_documents_by_id_e(id_e=id_e, type=type_flux)

    base_url = f"/entite/{id_e}/documents"
    type_flux_param = f"&type_flux={type_flux}" if type_flux else ""

    next_offset = offset + limit
    prev_offset = offset - limit if offset - limit >= 0 else None
    next_url = (
        f"{base_url}?offset={next_offset}&limit={limit}{type_flux_param}"
        if next_offset < count
        else None
    )
    prev_url = (
        f"{base_url}?offset={prev_offset}&limit={limit}{type_flux_param}"
        if prev_offset is not None
        else None
    )

    pagination = ResponsePagination(
        offset=offset, limit=limit, total=count, next=next_url, prev=prev_url
    )

    return DocumentPaginate(documents=docs, pagination=pagination)
