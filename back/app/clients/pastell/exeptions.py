from requests import HTTPError
from .models.errors import ApiErrorResponse


class ApiPastellClientError(Exception):
    """Exception de base pour le client API Pastell"""

    pass


class ApiError(ApiPastellClientError):
    """Erreur renvoyée par l'API Pastell.
    Elle porte la structure ApiErrorResponse
    """

    def __init__(self, api_error_response: ApiErrorResponse) -> None:
        self.errors = api_error_response.error_message


class ApiHttp40XError(ApiError):
    """Exception pour les 40X"""

    status_code: int

    def __init__(self, status, api_error_response: ApiErrorResponse) -> None:
        self.status_code = status
        super().__init__(api_error_response)
