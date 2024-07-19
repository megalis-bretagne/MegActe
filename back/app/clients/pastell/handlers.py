import functools

from .models.errors import ApiErrorResponse

from . import logger
from requests import HTTPError


from .exeptions import ApiHttp40XError


def _handle_httperr_40X(f):
    """Décorateur qui gère une erreur de l'API pastell générique"""

    @functools.wraps(f)
    def inner(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except HTTPError as e:
            data = e.response.json()
            api_error_response = ApiErrorResponse.from_json(data)
            logger.debug(
                f"L'API pastell retourne une erreur {e.response.status_code}, message {api_error_response.error_message}, request {e.request.url}"
            )
            if e.response.status_code == 404 or e.response.status_code == 403:
                raise ApiHttp40XError(e.response.status_code, api_error_response)
            else:
                raise e

    return inner


def call_handler(f):
    """handler qui combine la gestion d'erreur pour un appel API entreprise"""

    @functools.wraps(f)
    @_handle_httperr_40X
    def inner(*args, **kwargs):
        return f(*args, **kwargs)

    return inner
