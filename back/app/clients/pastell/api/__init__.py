from pydantic import TypeAdapter
import requests

from ..models.user_info import UserInfo
from ..models.config import Config
from ..handlers import call_handler
from requests.auth import HTTPBasicAuth


__all__ = ("entite_api", "ApiPastell")


class ApiPastell:
    """
    Client pour Pastell V4
    """

    def __init__(self, conf: Config, auth: HTTPBasicAuth = None) -> None:
        self._config = conf
        self._timeout_s = conf.timeout
        self._version = "v4"
        self._auth = auth

    def auth(self, auth: HTTPBasicAuth):
        self._auth = auth

    def perform_get(self, url, auth: HTTPBasicAuth = None, **kwagrs):
        return self._perform_request("GET", url, auth=auth, **kwagrs)

    def perform_patch(self, url, data, auth: HTTPBasicAuth = None):
        return self._perform_request("PATCH", url, data=data, auth=auth)

    def perform_delete(self, url, auth: HTTPBasicAuth = None):
        return self._perform_request("DELETE", url, auth=auth)

    def perform_post(self, url, data=None, files=None, auth: HTTPBasicAuth = None):
        return self._perform_request("POST", url, data=data, files=files, auth=auth)

    def get_user_by_id_u(self, id_u: int, auth: HTTPBasicAuth = None):
        """Retourne les infos d'un utilisateur

        Args:
            id_u (int): identifiant de l'utilisateur
            auth (HTTPBasicAuth, optional): le contexte utilisateur redéfini
        """

        response = self.perform_get(f"utilisateur/{id_u}", auth)
        return TypeAdapter(UserInfo).validate_python(response)

    def count_documents_by_id_e(self, id_e: int, type: str = None, auth: HTTPBasicAuth | None = None):
        """Retourne le nombre de document sur une entite

        Args:
            id_e (int): l'id_e
            type (str, optional): possibilité de filtré par le type de flux
            auth (HTTPBasicAuth, optional): _description_. Defaults to None.
        """
        query_param = {"id_e": id_e}
        # Dictionnaire pour renommer les clés
        if type:
            query_param["type"] = type

        count_response = self.perform_get("document/count", auth=auth, query_params=query_param)
        total = 0

        for _, value in count_response[str(id_e)]["flux"].items():
            if not isinstance(value, list):
                try:
                    total += sum(value.values())
                except TypeError:  # pour compatibilité pastell v3
                    total += sum(int(x) for x in value.values())

        return total

    @call_handler
    def _perform_request(
        self,
        method,
        url,
        data=None,
        query_params=None,
        files=None,
        auth: HTTPBasicAuth = None,
    ):
        """
        Méthode générique pour effectuer des requêtes HTTP.
        """
        full_url = f"{self._config.base_url}/{url}"
        response = requests.request(
            method=method,
            url=full_url,
            data=data,
            auth=auth if auth is not None else self._auth,
            files=files,
            timeout=self._timeout_s,
            params=query_params,
        )
        response.raise_for_status()

        # Retourner l'objet de réponse brut pour les requêtes GET de fichiers
        if method == "GET" and "file" in url:
            return response

        if not response.content:
            return None

        try:
            return response.json()
        except requests.JSONDecodeError:
            # Gérer le cas où la réponse n'est pas du JSON
            return {
                "status_code": response.status_code,
                "content": response.text,  # Retourne le contenu brut sous forme de texte
            }
