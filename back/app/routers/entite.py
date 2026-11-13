from typing import Annotated

from fastapi import APIRouter, Depends, Query

from ..clients.pastell.api import ApiPastell
from ..schemas.document_schemas import DocumentPaginate
from ..schemas.pagination import ResponsePagination
from ..services import get_or_make_api_pastell
from ..services.document_service import _EXECUTOR, DocumentService

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
    search: Annotated[
        str | None,
        Query(description="Filtre les documents dont l'objet contient cette chaîne"),
    ] = None,
    etat: Annotated[
        str | None,
        Query(description="Filtre sur le dernier état du document"),
    ] = None,
    etat_debut: Annotated[
        str | None,
        Query(description="Date ISO la plus ancienne d'entrée dans ce dernier état"),
    ] = None,
    etat_fin: Annotated[
        str | None,
        Query(description="Date ISO la plus récente d'entrée dans ce dernier état"),
    ] = None,
    etat_transit: Annotated[
        str | None,
        Query(description="Le document doit être passé par cet état"),
    ] = None,
    etat_transit_debut: Annotated[
        str | None,
        Query(description="Date ISO la plus ancienne d'entrée dans etat_transit"),
    ] = None,
    etat_transit_fin: Annotated[
        str | None,
        Query(description="Date ISO la plus récente d'entrée dans etat_transit"),
    ] = None,
    offset: int = 0,
    limit: int = 10,
    client: ApiPastell = Depends(get_or_make_api_pastell),
):
    has_filter = any([search, etat, etat_debut, etat_fin, etat_transit, etat_transit_debut, etat_transit_fin])

    def _fetch_docs():
        return DocumentService(client).list_documents_paginate(
            id_e,
            type_flux,
            offset,
            limit,
            search=search,
            lastetat=etat,
            last_state_begin=etat_debut,
            last_state_end=etat_fin,
            etatTransit=etat_transit,
            state_begin=etat_transit_debut,
            state_end=etat_transit_fin,
        )

    if has_filter:
        docs = _fetch_docs()
        # document/count est un agrégat par flux/état côté Pastell : il ignore ces filtres,
        # donc il ne reflète pas le nombre de résultats filtrés. On déduit un total à partir
        # de la page reçue (exact si elle n'est pas pleine, sinon on signale juste qu'il y a
        # potentiellement une page suivante).
        count = offset + len(docs) + (1 if len(docs) == limit else 0)
    else:
        # Les deux appels Pastell sont indépendants : on les lance en parallèle plutôt que
        # l'un après l'autre pour ne pas doubler le temps d'attente.
        docs_future = _EXECUTOR.submit(_fetch_docs)
        count_future = _EXECUTOR.submit(client.count_documents_by_id_e, id_e=id_e, type_document=type_flux)
        docs = docs_future.result()
        count = count_future.result()

    base_url = f"/entite/{id_e}/documents"
    type_flux_param = f"&type_flux={type_flux}" if type_flux else ""

    next_offset = offset + limit
    prev_offset = offset - limit if offset - limit >= 0 else None
    next_url = f"{base_url}?offset={next_offset}&limit={limit}{type_flux_param}" if next_offset < count else None
    prev_url = f"{base_url}?offset={prev_offset}&limit={limit}{type_flux_param}" if prev_offset is not None else None

    pagination = ResponsePagination(offset=offset, limit=limit, total=count, next=next_url, prev=prev_url)

    response = DocumentPaginate(documents=docs, pagination=pagination)

    return response
