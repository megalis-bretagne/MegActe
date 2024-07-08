from .models.errors import ApiErrorResponse


class ApiError(Exception):
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
