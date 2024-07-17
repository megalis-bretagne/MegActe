from pydantic import BaseModel


class ResponsePagination(BaseModel):
    """Modèle pour la pagination

    Args:
        BaseModel (_type_): _description_
    """

    offset: int
    limit: int
    total: int
    next: str | None = None
    prev: str | None = None
