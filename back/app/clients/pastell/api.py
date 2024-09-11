from pydantic import TypeAdapter
import requests

from .models.entite_info import EntiteInfo
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

    def get_entite(self, only_active: bool = False, auth: AuthUser = None):
        """Retourne les entités en fonction du contexte utilisateur

        Args:
            only_active (bool, optional): pour filtrer les entités actite uniquement ou non
            auth (AuthUser, optional): le contexte utilisateur redéfini

        Returns:
            Liste d'entite
        """
        list_entites = TypeAdapter(list[EntiteInfo]).validate_python(
            self.perform_get("/entite", auth)
        )

        return (
            list_entites
            if not only_active
            else filter(lambda entite: entite.is_active, list_entites)
        )

    def count_documents_by_id_e(
        self, id_e: int, type: str = None, auth: AuthUser = None
    ):
        """Retourne le nombre de document sur une entite

        Args:
            id_e (int): l'id_e
            type (str, optional): possibilité de filtré par le type de flux
            auth (AuthUser, optional): _description_. Defaults to None.
        """
        query_param = {"id_e": id_e}
        # Dictionnaire pour renommer les clés
        if type:
            query_param["type"] = type

        count_response = self.perform_get(
            "document/count", auth=auth, query_params=query_param
        )
        total = 0

        for key, value in count_response[str(id_e)]["flux"].items():
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

        # Retourner l'objet de réponse brut pour les requêtes GET de fichiers
        if method == "GET" and "file" in url:
            return response

        if not response.content:
            return None

        return response.json()
