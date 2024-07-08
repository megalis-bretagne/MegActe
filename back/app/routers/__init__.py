import functools, logging

from fastapi import Depends

from ..models.users import UserPastell

from ..database import get_user_from_db
from ..dependencies import settings
from ..clients.pastell.api import ApiPastell
from ..clients.pastell.models.config import Config
from ..clients.pastell.models.auth import AuthUser


def _make_api_pastell(auth: AuthUser = None) -> ApiPastell:

    api_config = Config(base_url=settings.pastell.url, timeout=settings.request_timeout)

    return ApiPastell(api_config, auth)


def get_or_make_api_pastell(
    current_user: UserPastell = Depends(get_user_from_db),
) -> ApiPastell:
    logging.debug(
        f"Get api pastell client for user : {current_user.login}, {current_user.id_pastell}"
    )
    auth = AuthUser(current_user.login, current_user.get_decrypt_password())
    return _make_api_pastell(auth)


@functools.cache
def get_or_make_api_pastell_for_admin() -> ApiPastell:
    logging.debug("Get api pastell client For Admin")
    return _make_api_pastell(
        AuthUser(login=settings.pastell.user, pwd=settings.pastell.password)
    )
