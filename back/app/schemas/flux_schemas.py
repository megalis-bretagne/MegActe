from pydantic import BaseModel


class Acte(BaseModel):
    type: str
    nom: str
