from pydantic import BaseModel
from typing import Dict, Any


class DocUpdateInfo(BaseModel):
    entite_id: int
    doc_info: Dict[str, Any]


class DocCreateInfo(BaseModel):
    entite_id: int
    flux_type: str
    doc_info: Dict[str, Any]
