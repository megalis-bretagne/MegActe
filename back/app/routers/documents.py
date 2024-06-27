from fastapi import APIRouter, Depends, File, UploadFile
from typing import List

from ..services.document_service import (
    update_document_service,
    create_document_service,
    get_document_info_service,
    delete_file_from_document_service,
    add_multiple_files_to_document_service,
    get_external_data_service,
)

from ..schemas.document_schemas import (
    DocCreateInfo,
    DocUpdateInfo,
    DeleteFileFromDoc,
    AddFilesToDoc,
)
from ..database import get_user_from_db

from ..models.users import UserPastell

router = APIRouter()


# Create doc
@router.post("/document", tags=["document"])
def add_acte_doc(doc: DocCreateInfo, user: UserPastell = Depends(get_user_from_db)):
    return create_document_service(doc, user)


# Update doc
@router.patch("/document/{document_id}", tags=["document"])
def update_document(
    document_id: str,
    request_data: DocUpdateInfo,
    user: UserPastell = Depends(get_user_from_db),
):
    return update_document_service(document_id, request_data, user)


# Get document info
@router.get("/document/{document_id}", tags=["document"])
def get_document(
    document_id: str, entite_id: int, user: UserPastell = Depends(get_user_from_db)
):
    return get_document_info_service(entite_id, document_id, user)


# Ajouter des fichiers à un document
@router.post("/document/{document_id}/file/{element_id}", tags=["document"])
def add_files_to_document(
    document_id: str,
    element_id: str,
    entite_id: int,
    files: List[UploadFile] = File(...),
    user: UserPastell = Depends(get_user_from_db),
):
    file_data = AddFilesToDoc(entite_id=entite_id, files=files)
    return add_multiple_files_to_document_service(
        document_id, element_id, file_data, user
    )


# Supprimer un fichier appartenant à un document
@router.delete("/document/{document_id}/file/{element_id}", tags=["document"])
def delete_file_from_document(
    document_id: str,
    element_id: str,
    request_data: DeleteFileFromDoc,
    user: UserPastell = Depends(get_user_from_db),
):
    return delete_file_from_document_service(
        document_id, element_id, request_data, user
    )


# Récupérer les valeurs pour un champ externalData
@router.get("/document/{document_id}/externalData/{element_id}", tags=["document"])
def get_external_data(
    entite_id: int,
    document_id: str,
    element_id: str,
    user: UserPastell = Depends(get_user_from_db),
):
    return get_external_data_service(entite_id, document_id, element_id, user)
