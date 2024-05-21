from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session


from ..models.users import UserPastell
from ..database import get_db
from ..dependencies import get_current_user
from ..schemas.user_schemas import UserCreate
from ..services.user_service import encrypt_password, generate_key, decrypt_password
import base64


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


# Todo :
# - Chiffrer le pwd => DONE
# - Envoyer le pwd non chifré à PASTELL via API: PATCH api/v2/utilisateur/ <ID_U> -d'password=<PWD>'


# Add user
@router.post("/users/add", response_model=UserCreate, tags=["users"])
def add_user(user_data: UserCreate, db: Session = Depends(get_db)):

    key = generate_key(user_data.pwd_pastell)
    encrypted_pwd = encrypt_password(user_data.pwd_pastell, key)

    new_user = UserPastell(
        login=user_data.login,
        id_pastell=user_data.id_pastell,
        pwd_pastell=encrypted_pwd,
        pwd_key=base64.urlsafe_b64encode(key).decode("utf-8"),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# Récuperer un pwd déchiffrer
@router.get("/users/decrypt_password/{user_id}", tags=["users"])
def get_decrypted_password(user_id: int, db: Session = Depends(get_db)):
    user = db.query(UserPastell).filter(UserPastell.id == user_id).first()
    if user:
        key = base64.urlsafe_b64decode(user.pwd_key.encode("utf-8"))
        try:
            decrypted_password = decrypt_password(user.pwd_pastell, key)
            return {"decrypted_password": decrypted_password}
        except Exception as e:
            raise HTTPException(status_code=400, detail="Decryption failed.")
    else:
        raise HTTPException(status_code=404, detail="User not found.")


# Update User
@router.put("/users/{user_id}", response_model=UserCreate, tags=["users"])
def update_user(user_id: int, user_data: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(UserPastell).filter(UserPastell.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    db_user.login = user_data.login
    db_user.id_pastell = user_data.id_pastell
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