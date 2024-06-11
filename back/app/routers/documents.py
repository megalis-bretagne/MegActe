from fastapi import APIRouter, Depends

from ..services.document_service import (
    update_document_service,
    create_document_service,
    get_document_info_service,
)

from ..schemas.document_schemas import DocCreateInfo, DocUpdateInfo
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
