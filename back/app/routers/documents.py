from typing_extensions import Annotated
from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from typing import List

from app.dependencies import get_settings
from ..schemas.flux_action import ActionResult
from ..services.acte_service import ActeService
from config.configuration import Settings

from ..clients.pastell.api import ApiPastell

from ..services import get_or_make_api_pastell

from ..services.document_service import DocumentService
from ..services.document_file_service import DocumentFileService

import logging

logger = logging.getLogger(__name__)

from ..schemas.document_schemas import (
    DocCreateInfo,
    DocUpdateInfo,
    DeleteFileFromDoc,
    AddFilesToDoc,
)

router = APIRouter()


# Create doc
@router.post("/entite/{entite_id}/document", tags=["document"])
def add_acte_doc(
    entite_id: int,
    doc: DocCreateInfo,
    client: ApiPastell = Depends(get_or_make_api_pastell),
):
    return client.perform_post(
        f"/entite/{entite_id}/document", data={"type": doc.flux_type}
    )


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
    settings: Annotated[Settings, Depends(get_settings)],
    client: ApiPastell = Depends(get_or_make_api_pastell),
):
    return DocumentService(client).get_single_document(
        entite_id, document_id, settings.document.external_data_to_retrieve
    )


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
        List[str],
        Query(
            title="les identifiants de documents",
            description="Les identifiants de documents",
        ),
    ] = [],
    client: ApiPastell = Depends(get_or_make_api_pastell),
):
    for doc_id in documents_id:
        logger.debug(f"Suppression du document  {doc_id} sur l'entite {entite_id}")
        client.perform_delete(f"/entite/{entite_id}/document/{doc_id}")
    return status.HTTP_200_OK


# Ajouter des fichiers à un document
@router.post(
    "/entite/{entite_id}/document/{document_id}/file/{element_id}", tags=["document"]
)
def add_files_to_document(
    document_id: str,
    element_id: str,
    entite_id: int,
    files: List[UploadFile] = File(...),
    client: ApiPastell = Depends(get_or_make_api_pastell),
):
    file_data = AddFilesToDoc(entite_id=entite_id, files=files)
    return DocumentFileService(client).add_multiple_files(
        document_id, element_id, file_data
    )


# Supprimer un fichier appartenant à un document
@router.delete(
    "/entite/{entite_id}/document/{document_id}/file/{element_id}", tags=["document"]
)
def delete_file_from_document(
    entite_id: int,
    document_id: str,
    element_id: str,
    request_data: DeleteFileFromDoc,
    client: ApiPastell = Depends(get_or_make_api_pastell),
):
    return DocumentFileService(client).delete_file(
        entite_id, document_id, element_id, request_data
    )


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
    client: ApiPastell = Depends(get_or_make_api_pastell),
):
    return DocumentFileService(client).get_file_by_name(
        entite_id, document_id, element_id, file_name
    )


# Attribuer un type à un fichier
@router.patch(
    "/entite/{entite_id}/document/{document_id}/externalData/{element_id}",
    tags=["document"],
)
def patch_external_data(
    document_id: str,
    entite_id: int,
    element_id: str,
    data: List[str],
    client: ApiPastell = Depends(get_or_make_api_pastell),
):

    if element_id == "type_piece":
        return DocumentFileService(client).assign_file_typologie(
            entite_id, document_id, element_id, data
        )
    return 200


# Récupérer les valeurs pour un champ externalData
@router.get(
    "/entite/{entite_id}/document/{document_id}/externalData/{element_id}",
    tags=["document"],
)
def get_external_data(
    entite_id: int,
    document_id: str,
    element_id: str,
    client: ApiPastell = Depends(get_or_make_api_pastell),
):
    return DocumentFileService(client).get_external_data(
        entite_id, document_id, element_id
    )


# transmettre le document
@router.post(
    "/entite/{entite_id}/document/{document_id}/{action}",
    tags=["document"],
    response_model=ActionResult,
    description="Envoi le document dans le flux pastell",
)
def perform_action_on_document(
    document_id: str,
    entite_id: int,
    action: str,
    client: ApiPastell = Depends(get_or_make_api_pastell),
):
    return ActeService(client).check_and_perform_action_service(
        entite_id, document_id, action
    )
