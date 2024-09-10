from typing_extensions import Annotated
from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from typing import List

from app.dependencies import get_settings
from config.configuration import Settings

from ..clients.pastell.api import ApiPastell
from ..routers import get_or_make_api_pastell

from ..services.document_service import (
    update_document_service,
    create_document_service,
    get_document_info_service,
    delete_file_from_document_service,
    add_multiple_files_to_document_service,
    get_external_data_service,
    cancel_transfer_tdt_document_service,
    transfer_tdt_document_service,
    assign_file_typologie_service,
    get_file_by_name_service,
)
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
@router.post("/document", tags=["document"])
def add_acte_doc(
    doc: DocCreateInfo, client: ApiPastell = Depends(get_or_make_api_pastell)
):
    return create_document_service(doc, client)


# Update doc
@router.patch("/document/{document_id}", tags=["document"])
def update_document(
    document_id: str,
    request_data: DocUpdateInfo,
    client: ApiPastell = Depends(get_or_make_api_pastell),
):
    return update_document_service(document_id, request_data, client)


# Get document info
@router.get("/entite/{entite_id}/document/{document_id}", tags=["document"])
def get_document(
    document_id: str,
    entite_id: int,
    settings: Annotated[Settings, Depends(get_settings)],
    client: ApiPastell = Depends(get_or_make_api_pastell),
):
    return get_document_info_service(
        entite_id, document_id, client, settings.document.external_data_to_retrieve
    )


# Delete Document
@router.delete(
    "/entite/{entite_id}/document",
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
    return add_multiple_files_to_document_service(
        document_id, element_id, file_data, client
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
    return delete_file_from_document_service(
        entite_id, document_id, element_id, request_data, client
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
    return get_file_by_name_service(
        entite_id, document_id, element_id, file_name, client
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
        return assign_file_typologie_service(
            entite_id, document_id, element_id, data, client
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
    return get_external_data_service(entite_id, document_id, element_id, client)


# Transmettre un doc via TDT
@router.post("/document/{document_id}/transfer-tdt", tags=["document"])
def transfer_tdt_document(
    document_id: str,
    entite_id: int,
    client: ApiPastell = Depends(get_or_make_api_pastell),
):
    return transfer_tdt_document_service(entite_id, document_id, client)


# Annuler la transmission TDT d'un doc
@router.post("/document/{document_id}/cancel-tdt", tags=["document"])
def cancel_document_transfer_tdt(
    document_id: str,
    entite_id: int,
    client: ApiPastell = Depends(get_or_make_api_pastell),
):
    return cancel_transfer_tdt_document_service(entite_id, document_id, client)
