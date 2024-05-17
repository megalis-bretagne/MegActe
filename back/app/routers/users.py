from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session


from ..models.users import UserPastell
from ..database import get_db
from ..dependencies import get_current_user
from ..schemas.user_schemas import UserCreate

router = APIRouter()


# Get infos user connecté
@router.get(
    "/user/me",
    tags=["users"],
    description="Récupère les informations de l'utilisateur connecté",
)
def get_user(
    current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)
):
    return current_user["login"]


# Get liste tous les users
@router.get("/users/getAll", tags=["users"])
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(UserPastell).all()
    return users


# Get user by id
@router.get("/users/{user_id}", tags=["users"])
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(UserPastell).filter(UserPastell.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


# Add user
@router.post("/users/add", response_model=UserCreate, tags=["users"])
def add_user(user_data: UserCreate, db: Session = Depends(get_db)):

    # Todo :
    # - Chiffré le pwd
    # - Envoyer le pwd non chifré à PASTELL via API: PATCH api/v2/utilisateur/ <ID_U> -d'password=<PWD>'

    new_user = UserPastell(
        login=user_data.login,
        id_user=user_data.id_user,
        pwd_pastell=user_data.pwd_pastell,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# Update User
@router.put("/users/{user_id}", response_model=UserCreate, tags=["users"])
def update_user(user_id: int, user_data: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(UserPastell).filter(UserPastell.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    db_user.login = user_data.login
    db_user.id_user = user_data.id_user
    db.commit()
    db.refresh(db_user)

    return db_user


# Delete User
@router.delete("/users/{user_id}", tags=["users"])
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(UserPastell).filter(UserPastell.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(db_user)
    db.commit()

    return {"message": "User deleted successfully"}
