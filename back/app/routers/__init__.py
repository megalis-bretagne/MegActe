import functools, logging
from typing import Callable, Type

from fastapi import Depends

from ..models.users import UserPastell

from ..database import get_user_from_db
from ..dependencies import settings
from ..clients.pastell.api import *
from ..clients.pastell.api import ApiPastell
from ..clients.pastell.models.config import Config
from ..clients.pastell.models.auth import AuthUser


def _make_api_pastell(
    cls: Type[ApiPastell],
    auth: AuthUser = None,
) -> ApiPastell:

    api_config = Config(base_url=settings.pastell.url, timeout=settings.request_timeout)
    return cls(api_config, auth)


def get_or_make_api_pastell(
    current_user: UserPastell = Depends(get_user_from_db),
) -> ApiPastell:
    logging.debug(
        f"Get api pastell client for user : {current_user.login}, {current_user.id_pastell}"
    )
    auth = AuthUser(current_user.login, current_user.get_decrypt_password())
    return _make_api_pastell(ApiPastell, auth)


def get_client_api(
    api_type: Type[ApiPastell],
) -> Callable[[UserPastell], ApiPastell]:
    def api_dependency(
        current_user: UserPastell = Depends(get_user_from_db),
    ) -> ApiPastell:
        auth = AuthUser(current_user.login, current_user.get_decrypt_password())
        return _make_api_pastell(api_type, auth)

    return api_dependency


@functools.cache
def get_or_make_api_pastell_for_admin() -> ApiPastell:
    logging.debug("Get api pastell client For Admin")
    return _make_api_pastell(
        ApiPastell, AuthUser(login=settings.pastell.user, pwd=settings.pastell.password)
    )
