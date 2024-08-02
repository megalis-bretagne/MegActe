from fastapi import APIRouter, Depends, File, UploadFile
from typing import List

from ..clients.pastell.api import ApiPastell
from ..routers import get_or_make_api_pastell

from ..services.document_service import (
    update_document_service,
    create_document_service,
    get_document_info_service,
    delete_file_from_document_service,
    add_multiple_files_to_document_service,
    get_external_data_service,
    delete_document_service,
    cancel_transfer_tdt_document_service,
    transfer_tdt_document_service,
    assign_file_types_service,
    get_file_by_name_service,
)

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
@router.get("/document/{document_id}", tags=["document"])
def get_document(
    document_id: str,
    entite_id: int,
    client: ApiPastell = Depends(get_or_make_api_pastell),
):
    return get_document_info_service(entite_id, document_id, client)


# Delete Document
@router.delete("/document/{document_id}", tags=["document"])
def delete_document(
    document_id: str,
    entite_id: int,
    client: ApiPastell = Depends(get_or_make_api_pastell),
):
    return delete_document_service(entite_id, document_id, client)


# Ajouter des fichiers à un document
@router.post("/document/{document_id}/file/{element_id}", tags=["document"])
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
@router.delete("/document/{document_id}/file/{element_id}", tags=["document"])
def delete_file_from_document(
    document_id: str,
    element_id: str,
    request_data: DeleteFileFromDoc,
    client: ApiPastell = Depends(get_or_make_api_pastell),
):
    return delete_file_from_document_service(
        document_id, element_id, request_data, client
    )


# Récupérer les fichiers liés à un document
@router.get("/document/{document_id}/file/{element_id}/{file_name}", tags=["document"])
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
@router.patch("/document/{document_id}/file/{element_id}/types", tags=["document"])
def assign_file_types(
    document_id: str,
    entite_id: int,
    element_id: str,
    file_types: List[str],
    client: ApiPastell = Depends(get_or_make_api_pastell),
):
    return assign_file_types_service(
        entite_id, document_id, element_id, file_types, client
    )


# Récupérer les valeurs pour un champ externalData
@router.get("/document/{document_id}/externalData/{element_id}", tags=["document"])
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
