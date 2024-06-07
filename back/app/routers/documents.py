from fastapi import APIRouter, Depends

from ..services.document_service import create_empty_document, update_document_service

from ..schemas.document_schemas import DocCreateEmpty, DocUpdateInfo
from ..database import get_user_from_db

from ..models.users import UserPastell

router = APIRouter()


# Create empty doc
@router.post("/document", tags=["document"])
def add_acte_doc(acte: DocCreateEmpty, user: UserPastell = Depends(get_user_from_db)):
    return create_empty_document(acte, user)


# Update doc
@router.patch("/document/{document_id}", tags=["document"])
def update_document(
    document_id: str,
    request_data: DocUpdateInfo,
    user: UserPastell = Depends(get_user_from_db),
):
    return update_document_service(document_id, request_data, user)
