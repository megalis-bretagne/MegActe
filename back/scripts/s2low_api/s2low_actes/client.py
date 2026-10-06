"""Client CLI et bibliotheque pour l'API ACTES de S2low.

Variables d'environnement:
  S2LOW_BASE_URL       URL de l'instance, ex. https://s2low.example.fr
  S2LOW_CERT_PATH      certificat client PEM, avec cle privee incluse ou accompagnee
  S2LOW_KEY_PATH       cle privee PEM si elle n'est pas incluse dans S2LOW_CERT_PATH
  S2LOW_LOGIN          login S2low (optionnel, doit etre fourni avec S2LOW_PASSWORD)
  S2LOW_PASSWORD       mot de passe S2low (optionnel, doit etre fourni avec S2LOW_LOGIN)
  S2LOW_CA_BUNDLE      bundle CA optionnel (defaut: verification systeme)
  S2LOW_VERIFY         true/false pour activer la verification TLS (defaut: true)
  S2LOW_TIMEOUT        timeout HTTP en secondes (defaut: 30)
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import requests
from requests import Response, Session


class S2lowError(RuntimeError):
    """Erreur fonctionnelle ou HTTP renvoyee par S2low."""


@dataclass(frozen=True)
class Settings:
    base_url: str
    cert: str | tuple[str, str]
    login: str | None
    password: str | None
    verify: bool | str
    timeout: float

    @classmethod
    def from_environment(cls) -> "Settings":
        base_url = _required_env("S2LOW_BASE_URL").rstrip("/")
        cert_path = Path(_required_env("S2LOW_CERT_PATH")).expanduser()
        if not cert_path.is_file():
            raise S2lowError(f"Certificat introuvable: {cert_path}")

        key_value = os.getenv("S2LOW_KEY_PATH")
        if key_value:
            key_path = Path(key_value).expanduser()
            if not key_path.is_file():
                raise S2lowError(f"Cle privee introuvable: {key_path}")
            cert: str | tuple[str, str] = (str(cert_path), str(key_path))
        else:
            cert = str(cert_path)

        verify_value = os.getenv("S2LOW_VERIFY", "true").lower()
        ca_bundle = os.getenv("S2LOW_CA_BUNDLE")
        if verify_value in {"0", "false", "no", "off"}:
            verify = False
        elif ca_bundle:
            verify_path = Path(ca_bundle).expanduser()
            if not verify_path.is_file():
                raise S2lowError(f"Bundle CA introuvable: {verify_path}")
            verify = str(verify_path)
        elif verify_value in {"1", "true", "yes", "on"}:
            verify = True
        else:
            verify_path = Path(os.path.expanduser(os.getenv("S2LOW_CA_BUNDLE", verify_value)))
            if not verify_path.is_file():
                raise S2lowError(f"Bundle CA introuvable: {verify_path}")
            verify = str(verify_path)

        try:
            timeout = float(os.getenv("S2LOW_TIMEOUT", "30"))
        except ValueError as exc:
            raise S2lowError("S2LOW_TIMEOUT doit etre un nombre") from exc

        login = os.getenv("S2LOW_LOGIN")
        password = os.getenv("S2LOW_PASSWORD")
        if bool(login) != bool(password):
            raise S2lowError(
                "S2LOW_LOGIN et S2LOW_PASSWORD doivent etre fournis ensemble"
            )

        return cls(
            base_url=base_url,
            cert=cert,
            login=login,
            password=password,
            verify=verify,
            timeout=timeout,
        )


class S2lowActesClient:
    """Client authentifie par certificat TLS et nounce S2low."""

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or Settings.from_environment()
        self.session: Session = requests.Session()
        self.session.cert = self.settings.cert
        self.session.verify = self.settings.verify
        if self.settings.login is not None and self.settings.password is not None:
            # S2low utilise aussi Basic sur chaque requete pour distinguer les
            # comptes qui partagent le meme certificat client.
            self.session.auth = (self.settings.login, self.settings.password)
        self._auth_params: dict[str, str] | None = None

    def _url(self, path: str) -> str:
        return f"{self.settings.base_url}/{path.lstrip('/')}"

    def _request(self, method: str, path: str, **kwargs: Any) -> Response:
        kwargs.setdefault("timeout", self.settings.timeout)
        response = self.session.request(method, self._url(path), **kwargs)
        if response.status_code >= 400:
            raise S2lowError(f"HTTP {response.status_code}: {response.text[:500]}")
        return response

    def authenticate(self) -> None:
        """Obtient un nounce puis prepare login/nounce/hash pour les appels API."""
        if self.settings.login is None or self.settings.password is None:
            raise S2lowError(
                "S2LOW_LOGIN et S2LOW_PASSWORD sont necessaires pour utiliser le nounce"
            )
        response = self._request(
            "GET",
            "/api/get-nounce.php",
            auth=(self.settings.login, self.settings.password),
        )
        try:
            nounce = response.json()["nounce"]
        except (ValueError, KeyError) as exc:
            raise S2lowError(f"Reponse nounce invalide: {response.text[:500]}") from exc

        digest = hashlib.sha256(
            f"{self.settings.password}:{nounce}".encode("utf-8")
        ).hexdigest()
        self._auth_params = {
            "login": self.settings.login,
            "nounce": nounce,
            "hash": digest,
        }

    def _params(self, params: dict[str, Any] | None = None) -> dict[str, Any]:
        if self._auth_params is None and self.settings.login is not None:
            self.authenticate()
        result = dict(self._auth_params or {})
        if params:
            result.update(params)
        return result

    def _json_get(self, path: str, params: dict[str, Any] | None = None) -> Any:
        response = self._request("GET", path, params=self._params(params))
        try:
            return response.json()
        except ValueError as exc:
            raise S2lowError(f"JSON attendu, reponse recue: {response.text[:500]}") from exc

    def _admin_auth(self) -> tuple[str, str]:
        if self.settings.login is None or self.settings.password is None:
            raise S2lowError("S2LOW_LOGIN et S2LOW_PASSWORD sont necessaires pour les appels admin")
        return self.settings.login, self.settings.password

    def _admin_get(self, path: str, params: dict[str, Any] | None = None) -> Any:
        """Appelle un endpoint d'administration JSON, avec repli texte pour les erreurs."""
        api_params = {"api": "1"}
        if params:
            api_params.update(params)
        # Les endpoints admin utilisent l'authentification TLS/Basic directe.
        # Le nounce est reserve aux endpoints qui l'exigent explicitement.
        response = self._request("GET", path, params=api_params, auth=self._admin_auth())
        return _json_or_text(response)

    def _admin_post(
        self,
        path: str,
        data: dict[str, Any],
        files: list[tuple[str, tuple[str, Any, str]]] | None = None,
    ) -> Any:
        response = self._request(
            "POST",
            path,
            params={"api": "1"},
            auth=self._admin_auth(),
            data={**data, "api": "1"},
            files=files,
        )
        return _json_or_text(response)

    # Administration S2low
    def admin_groups(self) -> Any:
        return self._admin_get("/admin/groups/admin_groups.php")

    def admin_authority_types(self) -> Any:
        return self._admin_get("/admin/authorities/admin_authority_types.php")

    def admin_authorities(
        self,
        *,
        name: str | None = None,
        authority_type: int | None = None,
        group: int | None = None,
        siren: str | None = None,
    ) -> Any:
        params: dict[str, Any] = {}
        if name is not None:
            params["name"] = name
        if authority_type is not None:
            params["type"] = authority_type
        if group is not None:
            params["group"] = group
        if siren is not None:
            params["siren"] = siren
        return self._admin_get("/admin/authorities/admin_authorities.php", params)

    def admin_modules(self) -> Any:
        return self._admin_get("/admin/modules/admin_modules.php")

    def admin_authority_detail(self, authority_id: int) -> Any:
        return self._admin_get(
            "/admin/authorities/admin_authority_detail.php", {"id": authority_id}
        )

    def admin_authority_sirens(self, authority_group_id: int | None = None) -> Any:
        params = {}
        if authority_group_id is not None:
            params["authority_group_id"] = authority_group_id
        return self._admin_get("/admin/authorities/admin_authorities_siren.php", params)

    def admin_authority_sirets(self, authority_id: int | None = None) -> Any:
        params = {"id": authority_id} if authority_id is not None else None
        return self._admin_get("/admin/authorities/admin_authority_siret.php", params)

    def edit_authority(
        self,
        *,
        authority_id: int,
        name: str,
        siren: str,
        authority_group_id: int,
        status: int,
        authority_type_id: int,
        address: str,
        postal_code: str,
        city: str,
        department: str,
        district: str,
    ) -> Any:
        """Edite une collectivite avec uniquement ses champs obligatoires."""
        return self._admin_post(
            "/admin/authorities/admin_authority_edit_handler.php",
            {
                "id": authority_id,
                "name": name,
                "siren": siren,
                "authority_group_id": authority_group_id,
                "status": status,
                "authority_type_id": authority_type_id,
                "address": address,
                "postal_code": postal_code,
                "city": city,
                "department": department,
                "district": district,
            },
        )

    def admin_user_roles(self) -> Any:
        return self._admin_get("/admin/users/admin_users_role.php")

    def admin_users(
        self,
        *,
        name: str | None = None,
        role: str | None = None,
        group: int | None = None,
        authority: int | None = None,
    ) -> Any:
        params: dict[str, Any] = {}
        if name is not None:
            params["name"] = name
        if role is not None:
            params["role"] = role
        if group is not None:
            params["group"] = group
        if authority is not None:
            params["authority"] = authority
        return self._admin_get("/admin/users/admin_users.php", params)

    def admin_user_detail(self, user_id: int) -> Any:
        return self._admin_get("/admin/users/admin_user_detail.php", {"id": user_id})

    def admin_user_logins(self) -> list[str]:
        """Liste les logins associés au certificat TLS présenté."""
        result = self._admin_get("/admin/users/api-list-login.php")
        if isinstance(result, str):
            return [login for login in result.splitlines() if login]
        raise S2lowError(f"Reponse inattendue pour la liste des logins: {result!r}")

    def edit_user(
        self,
        *,
        name: str,
        givenname: str,
        email: str,
        authority_id: int,
        role: str,
        status: int,
        auth_method: int,
        authority_group_id: int | None = None,
        user_id: int | None = None,
        login: str | None = None,
        password: str | None = None,
        certificate_path: str | None = None,
    ) -> Any:
        """Cree ou edite un utilisateur.

        ``login`` et ``password`` sont facultatifs. Un certificat utilisateur est
        necessaire lors d'une creation ; pour une edition, il peut etre omis afin
        de conserver le certificat existant.
        """
        data: dict[str, Any] = {
            "name": name,
            "givenname": givenname,
            "email": email,
            "authority_id": authority_id,
            "role": role,
            "status": status,
            "auth_method": auth_method,
        }
        if role.upper() == "GADM" and authority_group_id is None:
            raise ValueError("authority_group_id est obligatoire pour le role GADM")
        if authority_group_id is not None:
            data["authority_group_id"] = authority_group_id
        if user_id is not None:
            data["id"] = user_id
            data["mode"] = "modify"
        else:
            data["mode"] = "create"
        if login is not None:
            data["login"] = login
        if password is not None:
            data["password"] = password

        handles = []
        files = None
        if certificate_path:
            path = Path(certificate_path).expanduser()
            if not path.is_file():
                raise S2lowError(f"Certificat utilisateur introuvable: {path}")
            handle = path.open("rb")
            handles.append(handle)
            files = [("certificate", (path.name, handle, "application/x-pem-file"))]
        try:
            return self._admin_post("/admin/users/admin_user_edit_handler.php", data, files)
        finally:
            for handle in handles:
                handle.close()

    def status(self) -> Any:
        return self._json_get("/modules/actes/api/actes_status.php")

    def count(self, status_id: int) -> Any:
        return self._json_get(
            "/modules/actes/api/number_actes.php", {"status_id": status_id}
        )

    def list_actes(
        self,
        status_id: int,
        offset: int = 0,
        limit: int = 100,
        min_date: str | None = None,
        max_date: str | None = None,
    ) -> Any:
        params: dict[str, Any] = {
            "status_id": status_id,
            "offset": offset,
            "limit": limit,
        }
        if min_date:
            params["min_date"] = min_date
        if max_date:
            params["max_date"] = max_date
        return self._json_get("/modules/actes/api/list_actes.php", params)

    def prefecture_documents(self) -> Any:
        return self._json_get("/modules/actes/api/list_document_prefecture.php")

    def mark_prefecture_document_read(self, transaction_id: int) -> Any:
        return self._json_get(
            "/modules/actes/api/document_prefecture_mark_as_read.php",
            {"transaction_id": transaction_id},
        )

    def transaction_status(
        self, transaction: int | None = None, unique_id: str | None = None
    ) -> str:
        if transaction is None and unique_id is None:
            raise ValueError("transaction ou unique_id est requis")
        params = {"transaction": transaction} if transaction is not None else {"unique_id": unique_id}
        response = self._request(
            "GET", "/modules/actes/actes_transac_get_status.php", params=self._params(params)
        )
        return _legacy_text(response)

    def transaction_files(
        self, transaction: int | None = None, unique_id: str | None = None
    ) -> Any:
        if transaction is None and unique_id is None:
            raise ValueError("transaction ou unique_id est requis")
        params = {"transaction": transaction} if transaction is not None else {"unique_id": unique_id}
        response = self._request(
            "GET", "/modules/actes/actes_transac_get_files_list.php", params=self._params(params)
        )
        try:
            return response.json()
        except ValueError as exc:
            raise S2lowError(f"JSON attendu, reponse recue: {response.text[:500]}") from exc

    def create_transaction(
        self,
        *,
        nature_code: int,
        number: str,
        decision_date: str,
        acte_pdf_file: str,
        subject: str | None = None,
        type_acte: str | None = None,
        classification: dict[int, int] | None = None,
        attachments: list[str] | None = None,
        en_attente: bool = False,
        must_signed: bool = False,
    ) -> str:
        data: dict[str, Any] = {
            "nature_code": nature_code,
            "number": number,
            "decision_date": decision_date,
            "en_attente": "1" if en_attente else "0",
            "must_signed": "1" if must_signed else "0",
            "api": "1",
        }
        if subject is not None:
            data["subject"] = subject
        if type_acte is not None:
            data["type_acte"] = type_acte
        for level, value in (classification or {}).items():
            if level not in range(1, 6):
                raise ValueError("Les niveaux de classification vont de 1 a 5")
            data[f"classif{level}"] = value

        paths = [Path(acte_pdf_file), *(Path(item) for item in (attachments or []))]
        handles = []
        files: list[tuple[str, tuple[str, Any, str]]] = []
        try:
            main = paths[0]
            handle = main.open("rb")
            handles.append(handle)
            files.append(("acte_pdf_file", (main.name, handle, "application/pdf")))
            for path in paths[1:]:
                handle = path.open("rb")
                handles.append(handle)
                files.append(("acte_attachments[]", (path.name, handle, "application/pdf")))
            response = self._request(
                "POST",
                "/modules/actes/actes_transac_create.php",
                params=self._params(),
                data=data,
                files=files,
            )
        finally:
            for handle in handles:
                handle.close()
        return _legacy_text(response)


def _required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise S2lowError(f"Variable d'environnement obligatoire absente: {name}")
    return value


def _json_or_text(response: Response) -> Any:
    try:
        return response.json()
    except ValueError:
        return _legacy_text(response)


def _legacy_text(response: Response) -> str:
    content = response.content
    for encoding in ("utf-8", "iso-8859-1"):
        try:
            text = content.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    else:
        text = content.decode("utf-8", errors="replace")
    if text.startswith("KO"):
        raise S2lowError(text.strip())
    return text.strip()


def main() -> int:
    parser = argparse.ArgumentParser(description="Client Python de l'API ACTES S2low")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("status", help="Lister les statuts ACTES")
    subparsers.add_parser("admin-groups", help="Lister les groupes")
    subparsers.add_parser("admin-authority-types", help="Lister les types de collectivite")
    authorities = subparsers.add_parser("admin-authorities", help="Lister les collectivites")
    authorities.add_argument("--name", help="Filtrer sur le nom")
    authorities.add_argument("--type", dest="authority_type", type=int,
                             help="Filtrer sur le type de collectivite")
    authorities.add_argument("--group", type=int, help="Filtrer sur le groupe")
    authorities.add_argument("--siren", help="Filtrer sur le SIREN")
    subparsers.add_parser("admin-modules", help="Lister les modules")
    authority_detail = subparsers.add_parser("admin-authority-detail", help="Detail d'une collectivite")
    authority_detail.add_argument("authority_id", type=int)
    sirens = subparsers.add_parser("admin-authority-sirens", help="Lister les SIREN possibles")
    sirens.add_argument("--group-id", type=int)
    sirets = subparsers.add_parser("admin-authority-sirets", help="Lister les SIRET")
    sirets.add_argument("--authority-id", type=int)
    edit_authority = subparsers.add_parser("admin-edit-authority", help="Editer une collectivite")
    for name in ("name", "siren", "address", "postal-code", "city", "department", "district"):
        edit_authority.add_argument(f"--{name}", required=True)
    edit_authority.add_argument("--authority-id", type=int, required=True)
    edit_authority.add_argument("--group-id", type=int, required=True)
    edit_authority.add_argument("--status", type=int, required=True)
    edit_authority.add_argument("--authority-type-id", type=int, required=True)
    subparsers.add_parser("admin-user-roles", help="Lister les roles utilisateur")
    users = subparsers.add_parser("admin-users", help="Lister les utilisateurs")
    users.add_argument("--name", help="Filtrer sur le nom")
    users.add_argument("--role", help="Filtrer sur le role")
    users.add_argument("--group", type=int, help="Filtrer sur le groupe")
    users.add_argument("--authority", type=int, help="Filtrer sur la collectivite")
    user_detail = subparsers.add_parser("admin-user-detail", help="Detail d'un utilisateur")
    user_detail.add_argument("user_id", type=int)
    subparsers.add_parser("admin-user-logins", help="Lister les logins partageant le certificat")
    edit_user = subparsers.add_parser("admin-edit-user", help="Creer ou editer un utilisateur")
    for name in ("name", "givenname", "email", "role"):
        edit_user.add_argument(f"--{name}", required=True)
    edit_user.add_argument("--authority-id", type=int, required=True)
    edit_user.add_argument("--status", type=int, required=True)
    edit_user.add_argument("--auth-method", type=int, required=True)
    edit_user.add_argument("--authority-group-id", type=int)
    edit_user.add_argument("--user-id", type=int)
    edit_user.add_argument("--login")
    edit_user.add_argument("--password")
    edit_user.add_argument("--certificate-path")
    count = subparsers.add_parser("count", help="Compter les actes d'un statut")
    count.add_argument("status_id", type=int)
    listing = subparsers.add_parser("list", help="Lister les actes")
    listing.add_argument("status_id", type=int)
    listing.add_argument("--offset", type=int, default=0)
    listing.add_argument("--limit", type=int, default=100)
    listing.add_argument("--min-date")
    listing.add_argument("--max-date")
    transaction_status = subparsers.add_parser("transaction-status", help="Lire le statut d'une transaction")
    transaction_status.add_argument("transaction", type=int)
    transaction_files = subparsers.add_parser("transaction-files", help="Lister les fichiers d'une transaction")
    transaction_files.add_argument("transaction", type=int)
    create = subparsers.add_parser("create", help="Creer une transaction")
    create.add_argument("--nature-code", type=int, required=True)
    create.add_argument("--number", required=True)
    create.add_argument("--decision-date", required=True)
    create.add_argument("--file", required=True, dest="acte_pdf_file")
    create.add_argument("--subject")
    create.add_argument("--type-acte")
    create.add_argument("--attachment", action="append", default=[])
    create.add_argument("--en-attente", action="store_true")
    create.add_argument("--must-signed", action="store_true")

    args = parser.parse_args()
    try:
        client = S2lowActesClient()
        if args.command == "status":
            result = client.status()
        elif args.command == "admin-groups":
            result = client.admin_groups()
        elif args.command == "admin-authority-types":
            result = client.admin_authority_types()
        elif args.command == "admin-authorities":
            result = client.admin_authorities(
                name=args.name,
                authority_type=args.authority_type,
                group=args.group,
                siren=args.siren,
            )
        elif args.command == "admin-modules":
            result = client.admin_modules()
        elif args.command == "admin-authority-detail":
            result = client.admin_authority_detail(args.authority_id)
        elif args.command == "admin-authority-sirens":
            result = client.admin_authority_sirens(args.group_id)
        elif args.command == "admin-authority-sirets":
            result = client.admin_authority_sirets(args.authority_id)
        elif args.command == "admin-edit-authority":
            result = client.edit_authority(
                authority_id=args.authority_id,
                name=args.name,
                siren=args.siren,
                authority_group_id=args.group_id,
                status=args.status,
                authority_type_id=args.authority_type_id,
                address=args.address,
                postal_code=args.postal_code,
                city=args.city,
                department=args.department,
                district=args.district,
            )
        elif args.command == "admin-user-roles":
            result = client.admin_user_roles()
        elif args.command == "admin-users":
            result = client.admin_users(
                name=args.name,
                role=args.role,
                group=args.group,
                authority=args.authority,
            )
        elif args.command == "admin-user-detail":
            result = client.admin_user_detail(args.user_id)
        elif args.command == "admin-user-logins":
            result = client.admin_user_logins()
        elif args.command == "admin-edit-user":
            result = client.edit_user(
                name=args.name,
                givenname=args.givenname,
                email=args.email,
                authority_id=args.authority_id,
                role=args.role,
                status=args.status,
                auth_method=args.auth_method,
                authority_group_id=args.authority_group_id,
                user_id=args.user_id,
                login=args.login,
                password=args.password,
                certificate_path=args.certificate_path,
            )
        elif args.command == "count":
            result = client.count(args.status_id)
        elif args.command == "list":
            result = client.list_actes(args.status_id, args.offset, args.limit, args.min_date, args.max_date)
        elif args.command == "transaction-status":
            result = client.transaction_status(transaction=args.transaction)
        elif args.command == "transaction-files":
            result = client.transaction_files(transaction=args.transaction)
        else:
            result = client.create_transaction(
                nature_code=args.nature_code,
                number=args.number,
                decision_date=args.decision_date,
                acte_pdf_file=args.acte_pdf_file,
                subject=args.subject,
                type_acte=args.type_acte,
                attachments=args.attachment,
                en_attente=args.en_attente,
                must_signed=args.must_signed,
            )
        print(result if isinstance(result, str) else json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except (S2lowError, requests.RequestException, ValueError) as exc:
        print(f"Erreur: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
