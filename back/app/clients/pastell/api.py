import requests
from .models.config import Config
from .models.auth import AuthUser
from .handlers import call_handler


class ApiPastell:
    """
    Client pour Pastell V4
    """

    def __init__(self, conf: Config, auth: AuthUser = None) -> None:
        self._config = conf
        self._timeout_s = conf.timeout
        self._version = "v4"
        self._auth = auth

    def auth(self, auth: AuthUser):
        self._auth = auth

    def perform_get(self, url, auth: AuthUser = None, **kwagrs):
        return self._perform_request("GET", url, auth=auth, **kwagrs)

    def perform_patch(self, url, data, auth: AuthUser = None):
        return self._perform_request("PATCH", url, data=data, auth=auth)

    def perform_delete(self, url, auth: AuthUser = None):
        return self._perform_request("DELETE", url, auth=auth)

    def perform_post(self, url, data=None, files=None, auth: AuthUser = None):
        return self._perform_request("POST", url, data=data, files=files, auth=auth)

    @call_handler
    def _perform_request(
        self,
        method,
        url,
        data=None,
        query_params=None,
        files=None,
        auth: AuthUser = None,
    ):
        """
        Méthode générique pour effectuer des requêtes HTTP.
        """
        full_url = f"{self._config.base_url}/{url}"
        auth = auth.do_auth() if auth is not None else self._auth.do_auth()
        response = requests.request(
            method=method,
            url=full_url,
            data=data,
            auth=auth,
            files=files,
            timeout=self._timeout_s,
            params=query_params,
        )
        response.raise_for_status()

        if not response.content:
            return None

        return response.json()
