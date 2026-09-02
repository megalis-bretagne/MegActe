# AGENTS.md - FastAPI backend

## Stack

- python 3.12+
- `uv` for project and dependency management
- FastAPI
- SQLAlchemy 2.x
- Alembic for database migrations
- Type hints throughout the codebase

Companion frontend lives in `../nuxt-web-app`.

## Commands

- Lint: `uv run ruff check .`
- Format: `uv run ruff format .`
- Tests: `uv run pytest`
- Run the dev server: `uv run fastapi dev`
- Run the production server: `uv run fastapi run`

## Architecture

FastAPI application is located in './app' with the following key components:

- `./app/main.py`: FastAPI app initialization, middleware, and router registration
- `app/routers/`: FastAPI endpoints, i.e. route definitions organized by domains
- `app/services/`: Business logic implementation
- `app/clients/`: External HTTP APIs (Pastell, S2low)
- `app/models/`: SQLAlchemy ORM models for the local DB
- `app/schemas/`: Pydantic request/response models
- `app/dependencies.py`: Shared dependency injection functions
- `migrations/`: Alembic migration scripts
- `config/`: Yaml configuration files (excluded from git)
- `config/configuration.py`: a `pydantic-settings` `BaseSettings` tree (`Pastell`, `Keycloak`, `Database`, `S2low`, `DocumentConfig`) loaded from YAML (YAML configuration file in `config/`) + env/`.env`, exposed as a cached singleton via `dependencies.get_settings()` / `dependencies.settings`.
- Authorization flow: every router except `health` is protected by `dependencies.validate_token` (validates a Keycloak JWT against Keycloak's JWKS, checked in `app/main.py` via `Depends`). `get_current_user` then extracts the `preferred_username` from the token, and `database.get_user_from_db` looks that login up in the local `pastell_users` table to get the user's **Pastell** credentials (password stored encrypted, see `models/users.py::UserPastell.get_decrypt_password` / `app/utils`).

## Rules

- Use the official FastAPI AI coding-agent skill. Follow its
guidance for all FastAPI-related work, including application structure,
dependency injection, Pydantic models, routing, testing, and documentation.
The skill is bundled with the FastAPI package installed in this project. If is not installed already, before working on FastAPI code, run:

```bash
uvx library-skills
```

- Run `uv run ruff check .`, `uv run ruff format .` and `uv run pytest` before declaring work complete.
- Never modify `./pyproject.toml` without asking.
