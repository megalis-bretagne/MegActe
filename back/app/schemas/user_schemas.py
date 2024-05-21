from pydantic import BaseModel


class UserCreate(BaseModel):
    login: str
    id_pastell: int
    pwd_pastell: str
