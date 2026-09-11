"""Script de test de l'API Pastell (spécification docs/pastell_4.1.18_openapi.json).

Usage:
    uv run pastell_api.py --url https://pastell.example.org/api --token <token>
    uv run pastell_api.py --url https://pastell.example.org/api --token <token> --path /v2/version
    uv run pastell_api.py --url https://pastell.example.org/api --token <token> \
        --path /v2/utilisateur/123/token --method POST --data name=mon-jeton

Le mode par défaut exécute un smoke test en lecture seule sur les principaux
endpoints de l'API, en se reposant sur les éléments retournés (première entité,
premier document, premier flux, ...) pour tester les endpoints imbriqués.
"""
from __future__ import annotations

import argparse
import json
import sys
import warnings
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import requests

DEFAULT_TIMEOUT = 30
OK_STATUSES = (200, 201, 204)


@dataclass
class TestResult:
    name: str
    method: str
    path: str
    status: int | None
    ok: bool
    detail: str


class PastellClient:
    """Client HTTP minimal pour l'API REST Pastell (authentification Bearer)."""

    def __init__(
        self,
        base_url: str,
        token: str,
        *,
        timeout: int = DEFAULT_TIMEOUT,
        verify_ssl: bool = True,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.session = requests.Session()
        if token.lower().startswith("bearer "):
            token = token.split(" ", 1)[1]
        self.session.headers.update({"Authorization": f"Bearer {token}", "Accept": "application/json"})
        self.session.verify = verify_ssl
        if not verify_ssl:
            from urllib3.exceptions import InsecureRequestWarning

            warnings.filterwarnings("ignore", category=InsecureRequestWarning)

    def request(
        self,
        method: str,
        path: str,
        params: dict[str, Any] | None = None,
        data: dict[str, Any] | None = None,
    ) -> tuple[int | None, Any]:
        """Envoie une requête et retourne (code HTTP, corps parsé).

        `params` est envoyé en query string, `data` en corps de type
        application/x-www-form-urlencoded.
        """
        try:
            response = self.session.request(
                method,
                f"{self.base_url}{path}",
                params=params,
                data=data,
                timeout=self.timeout,
            )
        except requests.RequestException as exc:
            return None, str(exc)
        return response.status_code, _parse_body(response)


def _parse_body(response: requests.Response) -> Any:
    if response.status_code in (204, 205):
        return None
    if "json" in response.headers.get("Content-Type", ""):
        try:
            return response.json()
        except ValueError:
            return response.text
    return response.text


HTTP_METHODS = {"get", "post", "patch", "put", "delete", "head", "options", "trace"}


def list_endpoints(spec_path: Path) -> int:
    """Affiche les chemins et méthodes de l'API à partir de la spécification OpenAPI."""
    try:
        spec = json.loads(spec_path.read_text())
    except (OSError, ValueError) as exc:
        print(f"Erreur: impossible de lire la spécification {spec_path}: {exc}")
        return 1

    endpoints = []
    for path, methods in spec.get("paths", {}).items():
        for method, operation in methods.items():
            if method not in HTTP_METHODS:
                continue
            summary = operation.get("summary", "")
            endpoints.append((method.upper(), path, summary))

    endpoints.sort(key=lambda item: (item[1], item[0]))
    width = max(len(path) for _, path, _ in endpoints)
    for method, path, summary in endpoints:
        print(f"{method:<6} {path:<{width}}  {summary}".rstrip())
    print(f"\n{len(endpoints)} endpoint(s)")
    return 0


def summarize(data: Any) -> str:
    """Résumé court et lisible d'un corps de réponse."""
    if data is None:
        return ""
    if isinstance(data, list):
        if not data:
            return "0 élément(s)"
        sample = data[0]
        if isinstance(sample, dict):
            keys = ", ".join(list(sample)[:6])
            return f"{len(data)} élément(s) (ex: {keys})"
        return f"{len(data)} élément(s)"
    if isinstance(data, dict):
        if "error-message" in data:
            return f"erreur: {data['error-message']}"
        keys = ", ".join(list(data)[:8])
        return f"{{{keys}}}"
    return str(data)[:80]


def _first_id(items: Any, key: str) -> str | None:
    if not isinstance(items, list) or not items:
        return None
    first = items[0]
    if isinstance(first, dict):
        value = first.get(key)
        if value is None and "info" in first:  # id_d est dans info.id_d
            value = first["info"].get(key)
        return str(value) if value is not None else None
    return str(first)


def run_smoke_test(client: PastellClient) -> list[TestResult]:
    results: list[TestResult] = []

    def test(name: str, method: str, path: str, params: dict[str, Any] | None = None) -> tuple[int | None, Any]:
        status, body = client.request(method, path, params=params)
        results.append(
            TestResult(name=name, method=method, path=path, status=status, ok=status in OK_STATUSES, detail=summarize(body))
        )
        return status, body

    test("Version de l'API", "GET", "/v2/version")
    _, entities = test("Liste des entités", "GET", "/v2/entite")
    _, flux_list = test("Liste des flux", "GET", "/v2/flux")
    test("Liste des familles de connecteurs", "GET", "/v2/familleConnecteur")
    test("Liste des fréquences de connecteurs", "GET", "/v2/frequenceConnecteur")
    test("Liste des rôles délégables", "GET", "/v2/role")
    test("Liste des extensions", "GET", "/v2/extension")
    test("Liste des utilisateurs", "GET", "/v2/utilisateur")
    test("Liste de mes jetons API", "GET", "/v2/utilisateur/token")
    test("Journal (5 entrées)", "GET", "/v2/journal", params={"limit": "5"})

    id_e = _first_id(entities, "id_e")
    if id_e is not None:
        test("Détail de l'entité", "GET", f"/v2/entite/{id_e}")
        test("Associations flux de l'entité", "GET", f"/v2/entite/{id_e}/flux")
        _, connectors = test("Connecteurs de l'entité", "GET", f"/v2/entite/{id_e}/connecteur")
        test("Nombre de documents", "GET", f"/v2/entite/{id_e}/document/count")
        _, documents = test(
            "Documents de l'entité (10 max)",
            "GET",
            f"/v2/entite/{id_e}/document",
            params={"limit": "10", "offset": "0"},
        )

        id_ce = _first_id(connectors, "id_ce")
        if id_ce is not None:
            test("Détail du connecteur", "GET", f"/v2/entite/{id_e}/connecteur/{id_ce}")

        id_d = _first_id(documents, "id_d")
        if id_d is not None:
            test("Détail du document", "GET", f"/v2/entite/{id_e}/document/{id_d}")
        else:
            print("  (aucun document sur l'entité : tests par document ignorés)")
    else:
        print("  (aucune entité trouvée : tests par entité ignorés)")

    id_flux = _first_id(flux_list, "id_flux")
    if id_flux is not None:
        test("Définition du flux (champs)", "GET", f"/v2/flux/{id_flux}")
        test("Actions disponibles du flux", "GET", f"/v2/flux/{id_flux}/action")
    else:
        print("  (aucun flux trouvé : tests par flux ignorés)")

    return results


def print_results(results: list[TestResult]) -> int:
    failed = [r for r in results if not r.ok]
    width = max(len(r.path) for r in results) if results else 0
    for r in results:
        status = f"{r.status}" if r.status is not None else "-"
        badge = "OK  " if r.ok else "FAIL"
        print(f"[{badge}] {status:<5} {r.method:<4} {r.path:<{width}}  {r.detail}")
    print()
    print(f"Tests: {len(results)} — réussis: {len(results) - len(failed)} — échecs: {len(failed)}")
    return 1 if failed else 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Test client de l'API Pastell.")
    parser.add_argument("--url", help="URL de base de l'API Pastell, ex. https://pastell.example.org/api")
    parser.add_argument("--token", help="Jeton bearer de l'API Pastell")
    parser.add_argument("--path", help="Appel direct d'un chemin au lieu du smoke test, ex. /v2/entite")
    parser.add_argument("--method", default="GET", help="Méthode HTTP pour --path (défaut: GET)")
    parser.add_argument(
        "--param",
        action="append",
        default=[],
        metavar="KEY=VALUE",
        help="Paramètre de requête (query string), répétable (ex. --param limit=10)",
    )
    parser.add_argument(
        "--data",
        action="append",
        default=[],
        metavar="KEY=VALUE",
        help="Champ de formulaire du corps de la requête, répétable (ex. --data name=mon-jeton)",
    )
    parser.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT, help="Délai d'expiration des requêtes (secondes)")
    parser.add_argument("--no-verify", action="store_true", help="Désactive la vérification SSL (certificats auto-signés)")
    parser.add_argument(
        "--list-endpoints",
        action="store_true",
        help="Liste les chemins et méthodes de l'API depuis la spécification OpenAPI puis quitte",
    )
    parser.add_argument(
        "--spec",
        type=Path,
        default=Path(__file__).resolve().parent.parent / "docs" / "pastell_4.1.18_openapi.json",
        help="Chemin de la spécification OpenAPI (défaut: docs/pastell_4.1.18_openapi.json)",
    )
    args = parser.parse_args(argv)

    if args.list_endpoints:
        return list_endpoints(args.spec)

    if not args.url or not args.token:
        parser.error("--url et --token sont requis (sauf avec --list-endpoints)")

    client = PastellClient(args.url, args.token, timeout=args.timeout, verify_ssl=not args.no_verify)

    if args.path:
        params = {key: value for item in args.param for key, _, value in [item.partition("=")]}
        data = {key: value for item in args.data for key, _, value in [item.partition("=")]}
        status, body = client.request(args.method, args.path, params=params, data=data)
        print(f"{args.method} {args.path}  ->  {status}")
        if isinstance(body, (dict, list)):
            print(json.dumps(body, indent=2, ensure_ascii=False))
        elif body is not None:
            print(body)
        return 0 if status in OK_STATUSES else 1

    return print_results(run_smoke_test(client))


if __name__ == "__main__":
    sys.exit(main())