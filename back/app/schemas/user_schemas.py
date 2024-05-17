from pydantic import BaseModel


class UserCreate(BaseModel):
    login: str
    id_user: int
    pwd_pastell: str
