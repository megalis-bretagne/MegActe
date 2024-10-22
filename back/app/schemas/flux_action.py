from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class Rule(BaseModel):
    """Règle pour les actions documentaires."""

    last_action: List[str] = Field(alias="last-action", default=[])


class ActionDetails(BaseModel):
    """Détails de chaque action sur le document."""

    rule: Rule
    name_action: Optional[str] = Field(alias="name-action", default=None)
    name: Optional[str] = None
    warning: Optional[str] = None


class FluxAction(BaseModel):
    """Modèle pour représenter les actions disponibles sur un flux."""

    actions: Dict[str, ActionDetails]


class ActionResult(BaseModel):
    """
    Modèle de retour d'une action

    Args:
        BaseModel (_type_): _description_
    """

    result: bool = True
    message: Optional[str] = ""
    data: Optional[Dict] = None
