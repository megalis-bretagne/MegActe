import logging
from typing import Annotated

from fastapi import APIRouter, Depends, File, Query, UploadFile, status

from ..clients.pastell.api import ApiPastell
from ..schemas.flux_action import ActionResult
from ..services import get_or_make_api_pastell
from ..services.acte_service import ActeService
from ..services.document_file_service import DocumentFileService
from ..services.document_service import DocumentService

logger = logging.getLogger(__name__)

from ..schemas.document_schemas import (
    AddFilesToDoc,
    DeleteFileFromDoc,
    DocCreateInfo,
    DocumentActionRequest,
    DocUpdateInfo,
    JournalEntry,
)

router = APIRouter()


# Create doc
@router.post("/entite/{entite_id}/document", tags=["document"])
def add_acte_doc(
    entite_id: int,
    doc: DocCreateInfo,
    client: ApiPastell = Depends(get_or_make_api_pastell),
):
    return DocumentService(client).create_document(entite_id, doc.flux_type)


# Update doc
@router.patch("/entite/{entite_id}/document/{document_id}", tags=["document"])
def update_document(
    document_id: str,
    entite_id: int,
    request_data: DocUpdateInfo,
    client: ApiPastell = Depends(get_or_make_api_pastell),
):
    return client.perform_patch(
        f"/entite/{entite_id}/document/{document_id}",
        data=request_data.doc_info,
    )


# Get document info
@router.get("/entite/{entite_id}/document/{document_id}", tags=["document"])
def get_document(
    document_id: str,
    entite_id: int,
    type_flux: Annotated[
        str | None,
        Query(description="Type de flux déjà connu du front, pour paralléliser le fetch des actions possibles"),
    ] = None,
    skip_external_data: Annotated[
        bool,
        Query(description="Ne pas retélécharger les pièces jointes (utilisé pour le polling après une action)"),
    ] = False,
    client: ApiPastell = Depends(get_or_make_api_pastell),
):
    return DocumentService(client).get_single_document(
        entite_id, document_id, type_flux=type_flux, skip_external_data=skip_external_data
    )


# Champs external_data enrichis du document (pièces jointes, etc.), séparés de l'endpoint
# principal : la partie la plus lente à récupérer, pour ne pas bloquer l'affichage initial.
@router.get(
    "/entite/{entite_id}/document/{document_id}/external-data",
    tags=["document"],
)
def get_document_external_data(
    document_id: str,
    entite_id: int,
    keys: Annotated[
        list[str] | None,
        Query(
            description="Clés présentes dans le data du document (déjà connu du front), pour ne tenter que celles-ci"
        ),
    ] = None,
    client: ApiPastell = Depends(get_or_make_api_pastell),
):
    return DocumentService(client).get_document_external_data(entite_id, document_id, doc_keys=keys)


# Journal doc
@router.get(
    "/entite/{entite_id}/document/{document_id}/journal",
    tags=["document"],
    response_model=list[JournalEntry],
)
def get_document_journal(
    document_id: str,
    entite_id: int,
    client: ApiPastell = Depends(get_or_make_api_pastell),
):
    return DocumentService(client).get_document_journal(entite_id, document_id)


# Delete Document
@router.delete(
    "/entite/{entite_id}/documents",
    tags=["document"],
    description="Supprime une liste de documents",
    status_code=status.HTTP_200_OK,
)
def delete_document(
    entite_id: int,
    documents_id: Annotated[
        list[str],
        Query(
            title="les identifiants de documents",
            description="Les identifiants de documents",
        ),
    ] = None,
    client: ApiPastell = Depends(get_or_make_api_pastell),
):
    if documents_id is None:
        documents_id = []
    for doc_id in documents_id:
        logger.debug(f"Suppression du document  {doc_id} sur l'entite {entite_id}")
        client.perform_delete(f"/entite/{entite_id}/document/{doc_id}")
    return status.HTTP_200_OK


# Ajouter des fichiers à un document
@router.post("/entite/{entite_id}/document/{document_id}/file/{element_id}", tags=["document"])
def add_files_to_document(
    document_id: str,
    element_id: str,
    entite_id: int,
    files: list[UploadFile] = File(...),
    replace: bool = False,
    client: ApiPastell = Depends(get_or_make_api_pastell),
):
    file_data = AddFilesToDoc(entite_id=entite_id, files=files)
    return DocumentFileService(client).add_multiple_files(document_id, element_id, file_data, replace=replace)


# Supprimer un fichier appartenant à un document
@router.delete("/entite/{entite_id}/document/{document_id}/file/{element_id}", tags=["document"])
def delete_file_from_document(
    entite_id: int,
    document_id: str,
    element_id: str,
    request_data: DeleteFileFromDoc,
    client: ApiPastell = Depends(get_or_make_api_pastell),
):
    return DocumentFileService(client).delete_file(entite_id, document_id, element_id, request_data)


# Récupérer les fichiers liés à un document
@router.get(
    "/entite/{entite_id}/document/{document_id}/file/{element_id}/{file_name}",
    tags=["document"],
)
def get_file_for_document(
    document_id: str,
    entite_id: int,
    element_id: str,
    file_name: str,
    index: int | None = Query(None, description="Position du fichier, pour éviter un fetch en plus"),
    client: ApiPastell = Depends(get_or_make_api_pastell),
):
    return DocumentFileService(client).get_file_by_name(entite_id, document_id, element_id, file_name, index)


# Attribuer un type à un fichier
@router.patch(
    "/entite/{entite_id}/document/{document_id}/externalData/{element_id}",
    tags=["document"],
)
def patch_external_data(
    document_id: str,
    entite_id: int,
    element_id: str,
    data: list[str],
    client: ApiPastell = Depends(get_or_make_api_pastell),
):

    if element_id == "type_piece":
        return DocumentFileService(client).assign_file_typologie(entite_id, document_id, element_id, data)
    return 200


# Récupérer les valeurs pour un champ externalData (par document)
@router.get(
    "/entite/{entite_id}/document/{document_id}/externalData/{element_id}",
    tags=["document"],
)
def get_external_data(
    entite_id: int,
    document_id: str,
    element_id: str,
    type_flux: Annotated[
        str | None,
        Query(description="Type de flux déjà connu du front, pour réutiliser le cache par type de flux"),
    ] = None,
    client: ApiPastell = Depends(get_or_make_api_pastell),
):
    return DocumentFileService(client).get_external_data(entite_id, document_id, element_id, type_flux=type_flux)


# Récupérer les valeurs pour un champ externalData (par type de flux, sans document_id)
@router.get(
    "/entite/{entite_id}/flux/{flux_type}/externalData/{element_id}",
    tags=["document"],
)
def get_external_data_by_flux_type(
    entite_id: int,
    flux_type: str,
    element_id: str,
    client: ApiPastell = Depends(get_or_make_api_pastell),
):
    return DocumentFileService(client).get_external_data_by_flux_type(entite_id, flux_type, element_id)


@router.post(
    "/entite/{entite_id}/documents/perform_action",
    tags=["document"],
    response_model=ActionResult,  # On renvoie une liste de résultats
    description="Envoi les documents dans le flux pastell",
)
def perform_action_on_documents(
    entite_id: int,
    document_action_request: DocumentActionRequest,
    client: ApiPastell = Depends(get_or_make_api_pastell),
):
    if isinstance(document_action_request.document_ids, str):
        return ActeService(client).check_and_perform_action(
            entite_id, document_action_request.document_ids, document_action_request.action
        )

    return ActeService(client).perform_action_on_documents(
        entite_id, document_action_request.document_ids, document_action_request.action
    )
