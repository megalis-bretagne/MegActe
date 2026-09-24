"""Outil de synchronisation MegActe (ajout d'utilisateur, synchronisation globale).

Le script s'authentifie auprès de Keycloak via le grant ``client_credentials``
(service account, ex. ``megacte-sync``) puis appelle les endpoints admin de
l'API MegActe :

    - ajouter un utilisateur : POST /user
    - lancer une synchronisation globale : POST /users/refresh

Le ``client_id`` et le ``client_secret`` OIDC se lisent dans les variables
d'environnement suivantes (chaque valeur est aussi surchargeable en ligne de
commande) :

    MEGACTE_API_URL            URL de base de l'API MegActe, ex. http://localhost:8080
    MEGACTE_OIDC_TOKEN_URL     endpoint token Keycloak (client_credentials)
    MEGACTE_OIDC_CLIENT_ID     client OIDC dédié aux scripts
    MEGACTE_OIDC_CLIENT_SECRET secret de ce client
    MEGACTE_OIDC_SCOPE         (optionnel) scope à demander

Usage:
    uv run megacte_sync.py refresh
    uv run megacte_sync.py add-user --login alice@collectivite.fr --id-pastell 42

Exemple:
    export MEGACTE_API_URL=https://megacte.example.org
    export MEGACTE_OIDC_TOKEN_URL=https://sso.example.org/realms/megalis/protocol/openid-connect/token
    export MEGACTE_OIDC_CLIENT_ID=megacte-sync
    export MEGACTE_OIDC_CLIENT_SECRET=xxx
    uv run megacte_sync.py add-user --login alice@collectivite.fr --id-pastell 42
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass
from typing import Any

import requests

DEFAULT_TIMEOUT = 30

ENV_API_URL = "MEGACTE_API_URL"
ENV_TOKEN_URL = "MEGACTE_OIDC_TOKEN_URL"
ENV_CLIENT_ID = "MEGACTE_OIDC_CLIENT_ID"
ENV_CLIENT_SECRET = "MEGACTE_OIDC_CLIENT_SECRET"
ENV_SCOPE = "MEGACTE_OIDC_SCOPE"


class MegacteSyncError(Exception):
    """Erreur applicative du script (message affiché en sortie d'erreur)."""


@dataclass
class OidcCredentials:
    token_url: str
    client_id: str
    client_secret: str
    scope: str | None = None


def fetch_access_token(creds: OidcCredentials, timeout: int = DEFAULT_TIMEOUT) -> str:
    """Obtient un access token via le grant OIDC ``client_credentials``."""
    data: dict[str, str] = {
        "grant_type": "client_credentials",
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
    }
    if creds.scope:
        data["scope"] = creds.scope
    try:
        response = requests.post(creds.token_url, data=data, timeout=timeout)
    except requests.RequestException as exc:
        raise MegacteSyncError(f"Impossible de joindre le serveur de token: {exc}") from exc
    if response.status_code != 200:
        raise MegacteSyncError(f"Échec de l'obtention du token OIDC ({response.status_code}): {response.text.strip()}")
    body = response.json()
    token = body.get("access_token")
    if not token:
        raise MegacteSyncError("Réponse du serveur de token sans access_token")
    return token


def _parse_error_body(response: requests.Response) -> str:
    if "application/json" in response.headers.get("Content-Type", ""):
        try:
            body = response.json()
        except ValueError:
            return response.text or ""
        if isinstance(body, dict) and "detail" in body:
            return (
                f"{body['detail']} (code={body['code']})" if isinstance(body.get("code"), int) else str(body["detail"])
            )
        return str(body)
    return response.text or ""


def _request_json(session: requests.Session, method: str, url: str, **kwargs: Any) -> Any:
    kwargs.setdefault("timeout", DEFAULT_TIMEOUT)
    try:
        response = session.request(method, url, **kwargs)
    except requests.RequestException as exc:
        raise MegacteSyncError(f"Erreur réseau sur {method} {url}: {exc}") from exc
    if response.status_code >= 400:
        raise MegacteSyncError(f"{method} {url} -> {response.status_code}: {_parse_error_body(response)}")
    if not response.content:
        return None
    try:
        return response.json()
    except ValueError:
        return response.text


def run_add_user(api_url: str, token: str, login: str, id_pastell: int) -> int:
    """Crée un utilisateur via POST /user et affiche la réponse."""
    session = requests.Session()
    session.headers["Authorization"] = f"Bearer {token}"
    body = _request_json(session, "POST", f"{api_url}/user", json={"login": login, "id_pastell": id_pastell})
    print(json.dumps(body, indent=2, ensure_ascii=False) if body is not None else "Utilisateur créé")
    return 0


def run_refresh(api_url: str, token: str) -> int:
    """Lance la synchronisation globale via POST /users/refresh et affiche le message."""
    session = requests.Session()
    session.headers["Authorization"] = f"Bearer {token}"
    body = _request_json(session, "POST", f"{api_url}/users/refresh")
    if isinstance(body, dict):
        print(body.get("message", json.dumps(body, indent=2, ensure_ascii=False)))
    else:
        print(body or "Synchronisation terminée")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="megacte_sync.py",
        description="Ajoute un utilisateur dans MegActe et/ou lance la synchronisation globale.",
    )
    parser.add_argument(
        "--api-url", default=os.getenv(ENV_API_URL), help=f"URL de base de l'API MegActe (env: {ENV_API_URL})"
    )
    parser.add_argument(
        "--token-url", default=os.getenv(ENV_TOKEN_URL), help=f"Endpoint token Keycloak (env: {ENV_TOKEN_URL})"
    )
    parser.add_argument(
        "--client-id", default=os.getenv(ENV_CLIENT_ID), help=f"Client OIDC de synchronisation (env: {ENV_CLIENT_ID})"
    )
    parser.add_argument(
        "--client-secret",
        default=os.getenv(ENV_CLIENT_SECRET),
        help=f"Secret du client OIDC (env: {ENV_CLIENT_SECRET})",
    )
    parser.add_argument("--scope", default=os.getenv(ENV_SCOPE), help=f"Scope OIDC optionnel (env: {ENV_SCOPE})")
    parser.add_argument(
        "--timeout",
        type=int,
        default=DEFAULT_TIMEOUT,
        help=f"Délai d'expiration des requêtes (défaut: {DEFAULT_TIMEOUT})",
    )

    subparsers = parser.add_subparsers(dest="command", required=True)
    add_parser = subparsers.add_parser("add-user", help="Ajoute un utilisateur dans MegActe (POST /user)")
    add_parser.add_argument("--login", required=True, help="Login (username Keycloak / Pastell) de l'utilisateur")
    add_parser.add_argument(
        "--id-pastell", type=int, required=True, help="Identifiant Pastell (id_d ou id_e) de l'utilisateur"
    )
    subparsers.add_parser("refresh", help="Lance la synchronisation globale (POST /users/refresh)")

    args = parser.parse_args(argv)

    missing = [
        name
        for name, value in (
            ("URL API MegActe", args.api_url),
            ("URL token", args.token_url),
            ("client_id", args.client_id),
            ("client_secret", args.client_secret),
        )
        if not value
    ]
    if missing:
        parser.error(f"Paramètre(s) manquant(s): {', '.join(missing)}")

    creds = OidcCredentials(args.token_url, args.client_id, args.client_secret, args.scope)
    try:
        token = fetch_access_token(creds, timeout=args.timeout)
    except MegacteSyncError as exc:
        print(f"Erreur: {exc}", file=sys.stderr)
        return 1

    try:
        if args.command == "add-user":
            return run_add_user(args.api_url, token, args.login, args.id_pastell)
        return run_refresh(args.api_url, token)
    except MegacteSyncError as exc:
        print(f"Erreur: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
