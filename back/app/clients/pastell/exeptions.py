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


class ApiHttp50XError(ApiError):
    """Exception pour les 50X"""

    def __init__(self, api_error_response: ApiErrorResponse) -> None:
        super().__init__(HTTPStatus.INTERNAL_SERVER_ERROR, api_error_response)


class ApiHttpForbidden(ApiError):
    """Exception pour les problèmes de droits"""

    def __init__(self, api_error_response: ApiErrorResponse) -> None:
        self.status_code = HTTPStatus.FORBIDDEN
        super().__init__(api_error_response)


class ApiHttp40XError(ApiError):
    """Exception pour les 40X"""

    def __init__(self, status, api_error_response: ApiErrorResponse) -> None:
        super().__init__(status, api_error_response)
