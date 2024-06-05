from functools import wraps
from sqlalchemy.orm import Session
from app.configuration import read_config

from fastapi import Depends
from ..exceptions.custom_exceptions import (
    UserNotFoundException,
    UserPasswordNullException,
)
from ..dependencies import get_current_user
from ..database import get_db

from ..models.users import UserPastell


def get_user_from_db(current_user: dict, db: Session):
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


def get_config_and_timeout():
    """Récupère la configuration de l'app et le délai d'attente.

    Returns:
        tuple: Un tuple contenant la configuration de l'app et le délai d'attente.
    """
    config = read_config("config/config.yml")
    timeout = config.get("TIMEOUT")
    return config, timeout


def inject_user_and_config(func):
    """Injecte l'utilisateur et la configuration dans une fonction.

    Args:
       func (function): La fonction à décorer.


    Returns:
        function: La fonction décorée.
    """

    @wraps(func)
    def wrapper(
        current_user: dict = Depends(get_current_user),
        db: Session = Depends(get_db),
        *args,
        **kwargs
    ):
        user = get_user_from_db(current_user, db)
        config, timeout = get_config_and_timeout()
        return func(user, config, timeout, *args, **kwargs)

    return wrapper
