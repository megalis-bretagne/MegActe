from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session


from ..models.users import UserPastell
from ..database import get_db
from ..dependencies import get_current_user

router = APIRouter()


@router.get(
    "/user",
    tags=["users"],
    description="Récupère les informations de l'utilisateur connecté",
)
def get_user(
    current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)
):
    db_user = (
        db.query(UserPastell).filter(UserPastell.email == current_user["email"]).first()
    )
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@router.get("/users/{user_id}", tags=["users"])
def get_user_by_id(user_id: int):
    return user_id
