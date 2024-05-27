from pydantic import BaseModel, field_validator


class UserCreate(BaseModel):
    login: str
    id_pastell: int
    pwd_pastell: str


class UserInfo(BaseModel):
    id_u: int
    login: str
    nom: str
    prenom: str
    email: str
    certificat: list[str]
    id_e: int

    @field_validator("id_u", "id_e", mode="before")
    def parse_int(cls, v: str):
        return int(v)
