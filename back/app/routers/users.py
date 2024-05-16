from fastapi import APIRouter, Depends
from ..dependencies import get_current_user

router = APIRouter()


@router.get("/user/me", tags=["users"])
def get_users(current_user: dict = Depends(get_current_user)):
    return current_user


@router.get("/users/{user_id}", tags=["users"])
def get_user_by_id(user_id: int):
    return user_id
