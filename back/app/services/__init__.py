import functools
import logging
from collections.abc import Callable

from fastapi import Depends
from requests.auth import HTTPBasicAuth

from ..clients.pastell.api import *
from ..clients.pastell.api import ApiPastell
from ..clients.pastell.api.entite_api import EntiteApi
from ..clients.pastell.models.config import Config as PastellConfig
from ..clients.s2low.api import ApiS2low
from ..clients.s2low.models.config import Config as S2lowConfig
from ..database import get_user_from_db
from ..dependencies import settings
from ..models.users import UserPastell

logger = logging.getLogger(__name__)


def _make_api_pastell(
    cls: type[ApiPastell],
    auth: HTTPBasicAuth = None,
) -> ApiPastell:

    api_config = PastellConfig(base_url=settings.pastell.url, timeout=settings.request_timeout)
    return cls(api_config, auth)


def get_or_make_api_pastell(
    current_user: UserPastell = Depends(get_user_from_db),
) -> ApiPastell:
    logger.debug(f"Get api pastell client for user : {current_user.login}, {current_user.id_pastell}")
    auth = HTTPBasicAuth(current_user.login, current_user.get_decrypt_password())
    return _make_api_pastell(ApiPastell, auth)


def get_client_api_pastell(
    api_type: type[ApiPastell],
) -> Callable[[UserPastell], ApiPastell]:
    def api_dependency(
        current_user: UserPastell = Depends(get_user_from_db),
    ) -> ApiPastell:
        auth = HTTPBasicAuth(current_user.login, current_user.get_decrypt_password())
        return _make_api_pastell(api_type, auth)

    return api_dependency


@functools.cache
def get_or_make_api_pastell_for_admin() -> ApiPastell:
    logger.debug("Get api pastell client For Admin")
    return _make_api_pastell(
        ApiPastell,
        HTTPBasicAuth(settings.pastell.user, settings.pastell.password),
    )


@functools.cache
def get_or_make_api_s2low() -> ApiS2low:
    logger.debug("Get api S2low client")
    api_config = S2lowConfig(
        base_url=settings.s2low.url,
        certificate_path=settings.s2low.path_certificate,
        key_path=settings.s2low.path_key,
        key_password=settings.s2low.key_password,
    )
    return ApiS2low(api_config)


class BaseService:
    """
    Service megActe
    """

    api_pastell: ApiPastell | EntiteApi

    def __init__(self, api: ApiPastell = None) -> None:
        self.api_pastell = api
