from pydantic import BaseModel
from typing import Dict, Any


class DocCreateEmpty(BaseModel):
    entite_id: int
    flux_type: str


class DocUpdateInfo(BaseModel):
    entite_id: int
    acte_info: Dict[str, Any]
