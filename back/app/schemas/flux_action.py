from pydantic import BaseModel, Field


class Rule(BaseModel):
    """Règle pour les actions documentaires."""

    last_action: list[str] = Field(alias="last-action", default=[])


class ActionDetails(BaseModel):
    """Détails de chaque action sur le document."""

    rule: Rule
    name_action: str | None = Field(alias="name-action", default=None)
    name: str | None = None
    warning: str | None = None


class FluxAction(BaseModel):
    """Modèle pour représenter les actions disponibles sur un flux."""

    actions: dict[str, ActionDetails]


class ActionResult(BaseModel):
    """
    Modèle de retour d'une action

    Args:
        BaseModel (_type_): _description_
    """

    result: bool = True
    message: str | None = ""
    data: dict | None = None
