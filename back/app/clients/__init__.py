import functools
from ..dependencies import settings
from .pastell.api import ApiPastell
from .pastell.models.config import Config


def make_api_pastell() -> ApiPastell:

    api_config = Config(base_url=settings.pastell.url, timeout=settings.request_timeout)

    return ApiPastell(api_config)


@functools.cache
def get_or_make_api_pastell() -> ApiPastell:
    return make_api_pastell()
