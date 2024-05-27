from pydantic import BaseModel, field_validator


class EntiteInfo(BaseModel):
    id_e: int
    denomination: str
    siren: str
    type: str
    entite_mere: int
    centre_de_gestion: str

    @field_validator("id_e", "entite_mere", mode="before")
    def parse_int(cls, v: str):
        return int(v)
