import functools
from http import HTTPStatus

from .models.errors import ApiErrorResponse

from . import logger
from requests import HTTPError
from requests.exceptions import RequestException


from .exeptions import (
    ApiPastellHttp40XError,
    ApiPastellHttp50XError,
    ApiPastellHttpForbidden,
    ApiPastellHttpNotAuthorized,
)


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
                    raise ApiPastellHttpForbidden(api_error_response)

                if e.response.status_code == HTTPStatus.UNAUTHORIZED:
                    raise ApiPastellHttpNotAuthorized(api_error_response)

                raise ApiPastellHttp40XError(e.response.status_code, api_error_response)
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
            if e.response.status_code >= HTTPStatus.INTERNAL_SERVER_ERROR:
                error_response = ApiErrorResponse(status=str(e.response.status_code), error_message=e.response.text)
                logger.error(f"L'API pastell retourne une erreur {e.response.status_code}, request {e.request.url}")
                raise ApiPastellHttp50XError(error_response)
            else:
                raise

    return inner


def _handle_connection_error(f):
    """Décorateur qui gère les erreurs de connexion (timeout, DNS, connexion refusée...)
    vers l'API pastell, c'est-à-dire les cas où aucune réponse HTTP n'a été reçue.
    Sans ce décorateur, ces erreurs remontent telles quelles et font planter l'ASGI app
    (la réponse d'erreur qui en résulte n'a pas les en-têtes CORS, ce qui se manifeste
    côté navigateur comme un blocage CORS trompeur plutôt que comme l'erreur réseau réelle).
    """

    @functools.wraps(f)
    def inner(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except RequestException as e:
            logger.error(f"Erreur de connexion vers l'API pastell : {e}")
            error_response = ApiErrorResponse(status="error", error_message="Le service Pastell est indisponible ou n'a pas répondu à temps")
            raise ApiPastellHttp50XError(error_response)

    return inner


def call_handler(f):
    """handler qui combine la gestion d'erreur pour un appel API entreprise"""

    @functools.wraps(f)
    @_handle_connection_error
    @_handle_httperr_50X
    @_handle_httperr_40X
    def inner(*args, **kwargs):
        return f(*args, **kwargs)

    return inner
