import time

from pydantic import TypeAdapter
import requests
from requests.adapters import HTTPAdapter

from ..models.user_info import UserInfo
from ..models.config import Config
from ..handlers import call_handler
from requests.auth import HTTPBasicAuth


__all__ = ("entite_api", "ApiPastell")

# Cache du nombre de documents par entité, en dehors de la classe : un ApiPastell
# est recréé à chaque requête (client = Depends(get_or_make_api_pastell)), donc un
# cache sur self ne survivrait pas d'une page à l'autre. TTL court car le total peut
# changer (création/suppression de document), mais évite de refaire l'appel Pastell
# à chaque clic sur "page suivante" d'une même liste.
_COUNT_CACHE_TTL_S = 30
_count_documents_cache: dict[tuple[int, str | None], tuple[float, int]] = {}

# Session HTTP partagée à l'échelle du process, hors de la classe pour la même raison
# que le cache ci-dessus (ApiPastell recréé à chaque requête). Réutilise les connexions
# TCP/TLS déjà établies vers Pastell au lieu d'en ouvrir une nouvelle à chaque appel
# (perform_get/post/...), ce qui évite une poignée de main TLS à chaque requête.
_session = requests.Session()
# Aligné sur le pool de threads partagé (document_service._EXECUTOR, 32 workers)
_adapter = HTTPAdapter(pool_maxsize=32)
_session.mount("https://", _adapter)
_session.mount("http://", _adapter)


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

    def count_documents_by_id_e(self, id_e: int, type_document: str = None, auth: HTTPBasicAuth | None = None):
        """Retourne le nombre de document sur une entite

        Args:
            id_e (int): l'id_e
            type_document (str, optional): possibilité de filtré par le type de flux
            auth (HTTPBasicAuth, optional): _description_. Defaults to None.
        """
        cache_key = (id_e, type_document)
        cached = _count_documents_cache.get(cache_key)
        if cached and (time.monotonic() - cached[0]) < _COUNT_CACHE_TTL_S:
            return cached[1]

        query_param = {"id_e": id_e}
        # Dictionnaire pour renommer les clés
        if type_document:
            query_param["type"] = type_document

        count_response = self.perform_get("document/count", auth=auth, query_params=query_param)
        total = 0

        if len(count_response) == 0:
            _count_documents_cache[cache_key] = (time.monotonic(), 0)
            return 0

        for _, value in count_response[str(id_e)]["flux"].items():
            if not isinstance(value, list):
                try:
                    total += sum(value.values())
                except TypeError:  # pour compatibilité pastell v3
                    total += sum(int(x) for x in value.values())

        _count_documents_cache[cache_key] = (time.monotonic(), total)
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
        response = _session.request(
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
