from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..dependencies import get_current_user
from ..schemas.user_schemas import UserCreate
from ..services.user_service import (
    get_all_users_from_db,
    get_user_by_id_from_db,
    add_user_to_db,
    get_decrypted_password_from_db,
    update_user_in_db,
    delete_user_from_db,
    get_user_context_service,
)

router = APIRouter()


# Get infos user connecté
@router.get(
    "/user/me",
    tags=["users"],
    description="Récupère les informations de l'utilisateur connecté",
)
def get_user(current_user: dict = Depends(get_current_user)):
    return current_user["login"]


# Get liste de tous les users
@router.get("/users/getAll", tags=["users"])
def get_all_users(db: Session = Depends(get_db)):
    return get_all_users_from_db(db)


# Get user by id
@router.get("/users/get_user/{user_id}", tags=["users"])
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    return get_user_by_id_from_db(user_id, db)


# Add user
@router.post("/users/add", response_model=UserCreate, tags=["users"])
def add_user(user_data: UserCreate, db: Session = Depends(get_db)):
    return add_user_to_db(user_data, db)


# Récupérer un pwd chiffré et le déchiffrer
@router.get("/users/decrypt_password/{user_id}", tags=["users"])
def get_decrypted_password(user_id: int, db: Session = Depends(get_db)):
    return get_decrypted_password_from_db(user_id, db)


# Update User
@router.put("/users/{user_id}", response_model=UserCreate, tags=["users"])
def update_user(user_id: int, user_data: UserCreate, db: Session = Depends(get_db)):
    return update_user_in_db(user_id, user_data, db)


# Delete User
@router.delete("/users/{user_id}", tags=["users"])
def delete_user(user_id: int, db: Session = Depends(get_db)):
    return delete_user_from_db(user_id, db)


# Get user context
@router.get("/users/context", tags=["users"], response_model=dict)
def get_user_context(
    current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)
):
    return get_user_context_service(current_user, db)
