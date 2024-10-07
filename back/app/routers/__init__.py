import functools, logging
from typing import Callable, Type

from fastapi import Depends

from ..models.users import UserPastell

from ..database import get_user_from_db
from ..dependencies import settings
from ..clients.pastell.api import *
from ..clients.pastell.api import ApiPastell
from ..clients.s2low.api import ApiS2low
from ..clients.pastell.models.config import Config as PastellConfig
from ..clients.s2low.models.config import Config as S2lowConfig

from requests.auth import HTTPBasicAuth


def _make_api_pastell(
    cls: Type[ApiPastell],
    auth: HTTPBasicAuth = None,
) -> ApiPastell:

    api_config = PastellConfig(
        base_url=settings.pastell.url, timeout=settings.request_timeout
    )
    return cls(api_config, auth)


def get_or_make_api_pastell(
    current_user: UserPastell = Depends(get_user_from_db),
) -> ApiPastell:
    logging.debug(
        f"Get api pastell client for user : {current_user.login}, {current_user.id_pastell}"
    )
    auth = HTTPBasicAuth(current_user.login, current_user.get_decrypt_password())
    return _make_api_pastell(ApiPastell, auth)


def get_client_api_pastell(
    api_type: Type[ApiPastell],
) -> Callable[[UserPastell], ApiPastell]:
    def api_dependency(
        current_user: UserPastell = Depends(get_user_from_db),
    ) -> ApiPastell:
        auth = HTTPBasicAuth(current_user.login, current_user.get_decrypt_password())
        return _make_api_pastell(api_type, auth)

    return api_dependency


@functools.cache
def get_or_make_api_pastell_for_admin() -> ApiPastell:
    logging.debug("Get api pastell client For Admin")
    return _make_api_pastell(
        ApiPastell,
        HTTPBasicAuth(login=settings.pastell.user, pwd=settings.pastell.password),
    )


@functools.cache
def get_or_make_api_s2low() -> ApiS2low:
    logging.debug("Get api S2low client")
    api_config = S2lowConfig(
        base_url=settings.s2low.url,
        certificate_path=settings.s2low.path_certificate,
        key_path=settings.s2low.path_key,
    )
    return ApiS2low(api_config)
