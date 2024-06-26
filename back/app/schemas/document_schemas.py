from pydantic import BaseModel
from typing import Dict, Any
from fastapi import UploadFile
from typing import List


class DocUpdateInfo(BaseModel):
    entite_id: int
    doc_info: Dict[str, Any]


class DocCreateInfo(BaseModel):
    entite_id: int
    flux_type: str
    doc_info: Dict[str, Any]


class DeleteFileFromDoc(BaseModel):
    entite_id: int
    file_name: str


class AddFileToDoc(BaseModel):
    entite_id: int
    file: UploadFile


class AddFilesToDoc(BaseModel):
    entite_id: int
    files: List[UploadFile]
