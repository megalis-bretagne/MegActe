import os
from hashlib import sha256

import requests
import urllib3
from requests.auth import HTTPBasicAuth
from urllib3.exceptions import InsecureRequestWarning

from ..models.config import Config
from .adapter.ssl import SSLAdapter

__all__ = ("ApiS2low",)


class ApiS2low:
    """Client pour s2low


    Returns:
        _type_: _description_
    """

    TEST_AUTHENTICATION_ENDPOINT = "api/test-connexion.php"
    INFO_CONNEXION_ENDPOINT = "api/info-connexion.php"
    GET_NOUNCE_ENDPOINT = "api/get-nounce.php?api=1"
    ADMIN_AUTHORITIES_ENDPOINT = "admin/authorities/admin_authorities.php"
    ADMIN_USERS_ENDPOINT = "admin/users/admin_users.php"
    ADMIN_USER_EDIT_ENDPOINT = "admin/users/admin_user_edit_handler.php"
    ACTES_TRANSAC_POST_CONFIRME = "modules/actes/actes_transac_post_confirm_api.php"
    ACTES_TRANSAC_POST_CONFIRME_MULTI = "modules/actes/actes_transac_post_confirm_api_multi.php"

    def __init__(self, conf: Config):
        """
        Creation instance de session à s2low

        Args:
            conf (Config): _description_

        Raises:
            FileNotFoundError: si le certificat ou la clé n'est pas trouvé n'est pas trouvé
        """
        self._config = conf
        self._timeout = conf.timeout
        # gérer les configs
        self.session_request = requests.Session()
        self.session_request.verify = self._config.verify_host
        if self._config.verify_host is None:
            # https://urllib3.readthedocs.io/en/1.26.x/user-guide.html#certificate-verification
            if not os.path.exists(self._config.certificate_path):
                raise FileNotFoundError(f"Certificate file not found: {self._config.certificate_path}")
            if not os.path.exists(self._config.key_path):
                raise FileNotFoundError(f"Key file not found: {self._config.key_path}")
            self.session_request.mount(
                self._config.base_url,
                SSLAdapter(self._config.certificate_path, self._config.key_path, self._config.key_password),
            )
            # disable warning for insecure request since its use self signed certificate
            urllib3.disable_warnings(category=InsecureRequestWarning)
        if self._config.proxy_host:
            self.session_request.proxies = {
                "http": self._config.proxy_host,
                "https": self._config.proxy_host,
            }

    def test_auth(self, auth: HTTPBasicAuth):
        """Test la connexion à s2low

        Returns:
            _type_: _description_
        """
        response = self.session_request.get(self._config.base_url + self.TEST_AUTHENTICATION_ENDPOINT, auth=auth)
        response.raise_for_status()
        return response.text

    def info_connexion(self, auth: HTTPBasicAuth):
        """
        Retourne les infos de connexion à s2low avec le login passé en paramètre

        Args:
            auth (HTTPBasicAuth): Le login BasicAuth a passer

        Returns:
            _type_: _description_
        """
        response = self.session_request.get(
            self._config.base_url + self.INFO_CONNEXION_ENDPOINT,
            auth=auth,
            timeout=self._timeout,
        )
        response.raise_for_status()
        return response.json()

    def get_nounce(self, auth: HTTPBasicAuth):
        """
        Récupère un nounce valable 5min associé à l'utilisateur passé en paramètre

        Args:
            auth (HTTPBasicAuth): le login de l'utilisateur

        Returns:
            _type_: _description_
        """
        response = self.session_request.get(
            self._config.base_url + self.GET_NOUNCE_ENDPOINT,
            auth=auth,
            timeout=self._timeout,
        )
        response.raise_for_status()
        return response.status_code, response.json()["nounce"]

    def _admin_auth(self) -> HTTPBasicAuth:
        if not self._config.superadmin_login or not self._config.superadmin_password:
            raise RuntimeError("Les identifiants superadmin S2low ne sont pas configurés")
        return HTTPBasicAuth(self._config.superadmin_login, self._config.superadmin_password)

    def get_authority_by_siret(self, siret: str):
        response = self.session_request.get(
            self._config.base_url + self.ADMIN_AUTHORITIES_ENDPOINT,
            params={"api": "1", "siret": siret},
            auth=self._admin_auth(),
            timeout=self._timeout,
        )
        response.raise_for_status()
        return response.json()

    def get_authority_by_siren(self, siren: str):
        response = self.session_request.get(
            self._config.base_url + self.ADMIN_AUTHORITIES_ENDPOINT,
            params={"api": "1", "siren": siren},
            auth=self._admin_auth(),
            timeout=self._timeout,
        )
        response.raise_for_status()
        return response.json()

    def get_users(self, authority_id: int, name: str):
        response = self.session_request.get(
            self._config.base_url + self.ADMIN_USERS_ENDPOINT,
            params={"api": "1", "authority": authority_id, "name": name},
            auth=self._admin_auth(),
            timeout=self._timeout,
        )
        response.raise_for_status()
        return response.json()

    def create_technical_user(self, authority_id: int, password: str):
        data = {
            "name": "MegActe",
            "givenname": "MegActe",
            "email": "mdsn@megalis.bretagne.bzh",
            "role": "ADM",
            "authority_id": authority_id,
            "status": 1,
            "auth_method": 2,
            "login": f"megacte_{authority_id}",
            "password": password,
            "password2": password,
        }
        with open(self._config.certificate_path, "rb") as certificate:
            response = self.session_request.post(
                self._config.base_url + self.ADMIN_USER_EDIT_ENDPOINT,
                params={"api": "1"},
                auth=self._admin_auth(),
                data={**data, "mode": "create"},
                files={"certificate": (self._config.certificate_path, certificate, "application/x-pem-file")},
                allow_redirects=False,
                timeout=self._timeout,
            )
        response.raise_for_status()
        # S2low redirects to the newly created user's HTML page on success.
        # Following it is unnecessary and can fail because that endpoint may
        # not support the API client's TLS setup.
        if response.is_redirect:
            return {"status": "ok"}
        if not response.content:
            raise RuntimeError("S2low n'a retourné aucun résultat lors de la création du compte technique")
        try:
            result = response.json()
        except ValueError as exc:
            raise RuntimeError(f"Réponse S2low invalide lors de la création du compte : {response.text[:500]}") from exc
        if result.get("status") != "ok":
            raise RuntimeError(f"Échec de création du compte technique S2low : {result}")
        return result

    def get_url_post_confirm(self, auth: HTTPBasicAuth, tedetis_transaction_id: int) -> str:
        """
        Construit l'url pour confirmer l'envoi d'un acte (avec validation certificat)

        Args:
            auth (HTTPBasicAuth): le login/pwd du compte tech
            tedetis_transaction_id (list[number]): liste id de transaction

        Returns:
            str: l'url du service
        """

        _code, nounce = self.get_nounce(auth)

        to_hash = f"{auth.password}:{nounce}"
        hash_pass = sha256(str.encode(to_hash)).hexdigest()
        base_url = f"{self._config.base_url}{self.ACTES_TRANSAC_POST_CONFIRME}"
        return f"{base_url}?id={tedetis_transaction_id}&nounce={nounce}&login={auth.username}&hash={hash_pass}"

    def get_url_post_confirm_multi(self, auth: HTTPBasicAuth, tedetis_transaction_id: list[int]) -> str:
        """
        Construit l'url pour confirmer l'envoi d'un acte (avec validation certificat)

        Returns:
            str: _description_
        """
        _code, nounce = self.get_nounce(auth)

        to_hash = f"{auth.password}:{nounce}"
        hash_pass = sha256(str.encode(to_hash)).hexdigest()
        base_url = f"{self._config.base_url}{self.ACTES_TRANSAC_POST_CONFIRME_MULTI}"
        query_params = f"nounce={nounce}&login={auth.username}&hash={hash_pass}"
        ids = "&".join([f"id[]={t_id}" for t_id in tedetis_transaction_id])
        return f"{base_url}?{query_params}&{ids}"
