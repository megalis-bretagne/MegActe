from .models.errors import ApiErrorResponse
from http import HTTPStatus


class ApiError(Exception):
    """Erreur renvoyée par l'API Pastell.
    Elle porte la structure ApiErrorResponse
    """

    status_code: int

    def __init__(self, status, api_error_response: ApiErrorResponse) -> None:
        self.status_code = status
        self.errors = api_error_response.error_message


class ApiPastellHttp50XError(ApiError):
    """Exception pour les 50X"""

    def __init__(self, api_error_response: ApiErrorResponse) -> None:
        super().__init__(HTTPStatus.INTERNAL_SERVER_ERROR, api_error_response)


class ApiPastellHttpForbidden(ApiError):
    """Exception pour les problèmes d'accès"""

    def __init__(self, api_error_response: ApiErrorResponse) -> None:
        super().__init__(HTTPStatus.FORBIDDEN, api_error_response)


class ApiPastellHttpNotAuthorized(ApiError):
    """Exception pour les problèmes de droits"""

    def __init__(self, api_error_response: ApiErrorResponse) -> None:
        super().__init__(HTTPStatus.UNAUTHORIZED, api_error_response)


class ApiPastellHttp40XError(ApiError):
    """Exception pour les 40X"""

    def __init__(self, status, api_error_response: ApiErrorResponse) -> None:
        super().__init__(status, api_error_response)
