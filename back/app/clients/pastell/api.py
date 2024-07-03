from ast import Tuple
import requests
from .models.config import Config
from .models.auth import AuthUser


class ApiPastell:
    """
    Client pour Pastell V4
    """

    def __init__(self, conf: Config) -> None:
        self._config = conf
        self._timeout_s = conf.timeout
        self._version = "v4"
        self._auth = None

    def auth(self, auth: AuthUser):
        self._auth = auth
        return self

    def perform_get(self, url, auth: AuthUser = None):

        response = requests.get(
            url=f"{self._config.base_url}/{url}",
            auth=auth.do_auth() if auth is not None else self._auth.do_auth(),
            timeout=self._timeout_s,
        )
        return response

    def _perform_post(self, url):

        response = requests.post(
            url=f"{self._config.base_url}/{url}",
            auth=self._auth,
            timeout=self._timeout_s,
            params=self._query_params,
        )
        return response

    def _perform_patch(self, url):

        response = requests.patch(
            url=f"{self._config.base_url}/{url}",
            auth=self._auth,
            timeout=self._timeout_s,
            params=self._query_params,
        )
        return response
