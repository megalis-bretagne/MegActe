from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..database import get_user_from_db
from ..schemas.user_schemas import UserCreate
from ..services.user_service import (
    get_all_users_from_db,
    get_user_by_id_from_db,
    add_user_to_db,
    update_user_in_db,
    delete_user_from_db,
    get_user_context_service,
    get_user_flux_service,
)
from ..models.users import UserPastell

router = APIRouter()


# Get infos user connecté
@router.get(
    "/user",
    tags=["users"],
    response_model=dict,
    description="Récupère les informations de l'utilisateur connecté",
)
def get_user(user: UserPastell = Depends(get_user_from_db)):
    return get_user_context_service(user)


# Get liste de tous les users
@router.get("/users", tags=["users"])
def get_all_users(db: Session = Depends(get_db)):
    return get_all_users_from_db(db)


# Get user by id
@router.get("/user/{user_id}", tags=["users"])
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    return get_user_by_id_from_db(user_id, db)


# Add user
@router.post("/user/add", response_model=UserCreate, tags=["users"])
def add_user(user_data: UserCreate, db: Session = Depends(get_db)):
    return add_user_to_db(user_data, db)


# Update User
@router.put("/user/{user_id}", response_model=UserCreate, tags=["users"])
def update_user(user_id: int, user_data: UserCreate, db: Session = Depends(get_db)):
    return update_user_in_db(user_id, user_data, db)


# Delete User
@router.delete("/user/{user_id}", tags=["users"])
def delete_user(user_id: int, db: Session = Depends(get_db)):
    return delete_user_from_db(user_id, db)


# Get liste des flux dispo pour l'utilisateur connecté
@router.get("/flux", tags=["users"])
def get_user_flux(user: UserPastell = Depends(get_user_from_db)):
    return get_user_flux_service(user)
