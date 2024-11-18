import functools
from http import HTTPStatus

from .models.errors import ApiErrorResponse

from . import logger
from requests import HTTPError


from .exeptions import ApiHttp40XError, ApiHttp50XError, ApiHttpForbidden


def _handle_httperr_40X(f):
    """Décorateur qui gère une erreur de l'API pastell générique"""

    @functools.wraps(f)
    def inner(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except HTTPError as e:
            if e.response.status_code >= 400 and e.response.status_code < 500:
                data = e.response.json()
                api_error_response = ApiErrorResponse.from_json(data)
                logger.error(
                    f"L'API pastell retourne une erreur {e.response.status_code}, message {api_error_response.error_message}, request {e.request.url}"
                )
                if e.response.status_code == HTTPStatus.FORBIDDEN:
                    raise ApiHttpForbidden(api_error_response)

                raise ApiHttp40XError(e.response.status_code, api_error_response)
            else:
                raise

    return inner


def _handle_httperr_50X(f):
    """Décorateur qui gère une erreur de l'API pastell générique"""

    @functools.wraps(f)
    def inner(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except HTTPError as e:
            if e.response.status_code >= 500:
                error_response = ApiErrorResponse(status=HTTPError, error_message=e.response.text)
                logger.error(f"L'API pastell retourne une erreur {e.response.status_code}, request {e.request.url}")
                raise ApiHttp50XError(e.response.status_code, error_response)
            else:
                raise

    return inner


def call_handler(f):
    """handler qui combine la gestion d'erreur pour un appel API entreprise"""

    @functools.wraps(f)
    @_handle_httperr_50X
    @_handle_httperr_40X
    def inner(*args, **kwargs):
        return f(*args, **kwargs)

    return inner
