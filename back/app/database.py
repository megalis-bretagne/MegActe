from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import Session
from .models.users import UserPastell
from .exceptions.custom_exceptions import (
    UserNotFoundException,
    UserPasswordNullException,
)
from .dependencies import config, get_current_user
from fastapi import Depends


url = config["DB"]["user"]
DATABASE_URL = f'postgresql://{config["DB"]["user"]}:{config["DB"]["pwd"]}@{config["DB"]["host"]}:{config["DB"]["port"]}/{config["DB"]["database"]}'

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Dépendance de session de base de données
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_user_from_db(
    current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Récupère l'utilisateur depuis la BD.

    Args:
        current_user (dict): Le dictionnaire contenant les infos du user actuel
        db (Session): La session de BD
    Raises:
        UserNotFoundException: Si le user n'est pas trouvé dans la BD.
        UserPasswordNullException: i le mot de passe du user est manquant.

    Returns:
        UserPastell: L'utilisateur récupéré depuis la BD.
    """
    login = current_user["login"]
    user = db.query(UserPastell).filter(UserPastell.login == login).first()
    if not user:
        raise UserNotFoundException()
    if not user.pwd_pastell:
        raise UserPasswordNullException()
    return user
