# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

MegActe backend: a FastAPI service that acts as a friendlier layer in front of **Pastell** (a French local-government
document/workflow platform, accessed via its v4 REST API) and **S2low** (transmission to the "Trésor Public"/TDT).
It authenticates users via Keycloak (OAuth2/JWT), stores a small local Postgres table mapping each Keycloak user to
their Pastell credentials, and proxies/orchestrates calls to the Pastell and S2low APIs.

The companion frontend lives at `../nuxt-web-app` (Nuxt 3). This CLAUDE.md only covers the `back` directory.

## Commands

Run all commands from the `back` directory with the venv activated (`source .venv/bin/activate`).

```bash
# Run the full test suite
python -m pytest

# Run a single test file / test
python -m pytest tests/services/test_document_service.py
python -m pytest tests/services/test_document_service.py::test_name -v

# Format (black, line-length 120)
black .

# Apply DB migrations (Postgres, versioned with Alembic)
alembic upgrade head

# Create a new migration after changing app/models/*
alembic revision --autogenerate -m "description"

# Run the dev server (reload) — see docker-backend-start.sh
fastapi run app/main.py --reload --port 8080

# Swagger UI
# http://HOST:PORT/docs
```

Config: copy `config/config_template.yml` to `config/config.yml` and fill in real values (Pastell, Keycloak, DB,
S2low). `config/configuration.py` loads `config/config.yml` if present, else falls back to `config_template.yml`;
env vars / `.env` can override individual fields (see `Settings.settings_customise_sources`).

Tests use a local SQLite file (`test.db`, `tests/conftest.py`) instead of the real Postgres DB; each test runs
inside a transaction that is rolled back in `tearDown`.

## Architecture

**Layering**: `routers/` (FastAPI endpoints, thin) → `services/` (business logic) → `clients/` (external HTTP APIs:
Pastell, S2low). `models/` are SQLAlchemy ORM models for the local DB (currently just the Pastell user↔credentials
mapping); `schemas/` are Pydantic request/response models.

- **Auth flow**: every router except `health` is protected by `dependencies.validate_token` (validates a Keycloak
  JWT against Keycloak's JWKS, checked in `app/main.py` via `Depends`). `get_current_user` then extracts the
  `preferred_username` from the token, and `database.get_user_from_db` looks that login up in the local
  `pastell_users` table to get the user's **Pastell** credentials (password stored encrypted, see
  `models/users.py::UserPastell.get_decrypt_password` / `app/utils`). So a request effectively carries two
  identities: the Keycloak JWT (who the caller is) and the resolved Pastell `HTTPBasicAuth` (what the app calls
  Pastell as).
- **Pastell client construction**: `services/__init__.py` builds `ApiPastell` clients as FastAPI dependencies —
  `get_or_make_api_pastell` (per-request, current user's credentials), `get_client_api_pastell` (parametrized by
  API subclass, e.g. `EntiteApi`), `get_or_make_api_pastell_for_admin` (cached, uses the service-account credentials
  from `settings.pastell`), and `get_or_make_api_s2low` (cached, S2low client from `settings.s2low`). Routers depend
  on these rather than instantiating clients directly.
- **`ApiPastell` (`clients/pastell/api/__init__.py`)**: thin wrapper around `requests` with generic
  `perform_get/post/patch/delete`, plus a couple of higher-level helpers (`count_documents_by_id_e` has a short
  process-wide TTL cache since a fresh client is created per request and can't cache on `self`). HTTP calls go
  through a **module-level shared `requests.Session`** (connection pooling, sized to match
  `document_service._EXECUTOR`) and are wrapped with `@call_handler` (`clients/pastell/handlers.py`), which maps
  Pastell HTTP error responses to typed exceptions (`clients/pastell/exeptions.py`:
  `ApiPastellHttp40X/50XError`, `ApiPastellHttpForbidden`, `ApiPastellHttpNotAuthorized`).
- **Error handling**: business errors are raised as `MegActeException` subclasses (`exceptions/custom_exceptions.py`,
  each with an `ErrorCode`, HTTP status, and detail message) or as the Pastell client exceptions above.
  `exceptions/error_handlers.py` registers FastAPI exception handlers (`add_exception_handlers`, called from
  `app/main.py`) that convert both families into a uniform `MegacteErrorResponse` JSON body
  (`{detail, code, status_code}`) — don't return ad-hoc error shapes from routers/services, raise one of these
  instead.
- **Documents domain** (`routers/documents.py`, `services/document_service.py`, `services/document_file_service.py`,
  `services/acte_service.py`) is the largest area: creating/updating Pastell "documents" (actes), attaching/removing
  files, reading Pastell "external data" fields (attachment metadata, typology), and running workflow actions
  (`ActeService.perform_action_on_documents` / `check_and_perform_action`) that push documents through Pastell/S2low
  states. `DocumentConfig` in `config/configuration.py` lists which external-data keys get fetched and which Pastell
  states count as "final" (`ActionDocument.termine`, `accepter_sae`, `ar_recu_sae`).
- **Settings** (`config/configuration.py`): a `pydantic-settings` `BaseSettings` tree (`Pastell`, `Keycloak`,
  `Database`, `S2low`, `DocumentConfig`) loaded from YAML + env/`.env`, exposed as a cached singleton via
  `dependencies.get_settings()` / `dependencies.settings`.
- **DB migrations**: SQLAlchemy models under `app/models/` (declared against `app/models/base.py::Base`); Alembic
  autogeneration in `migrations/env.py` targets `Base.metadata`, so new models need `alembic revision --autogenerate`
  to get a migration.
