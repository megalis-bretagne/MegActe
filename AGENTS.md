# AGENTS.md

## Repo structure

MegActe is a document/workflow tool ("surcouche Pastell") for French local authorities. It is a web service with a backend and a frontend. Monorepo with three main directories:

| Directory | Stack | Status |
|-----------|-------|--------|
| `nuxt-web-app/` | Nuxt 4, Vue 3, PrimeVue 4, Tailwind | **Active frontend** — primary dev focus |
| `back/` | Python 3.12+, FastAPI, SQLAlchemy, Alembic | Backend API (proxies Pastell v4) |
| `web-app/` | Angular 18 | **Legacy** — being replaced by Nuxt |

## Per-directory guidance

- **`nuxt-web-app/`** — read [`nuxt-web-app/AGENTS.md`](nuxt-web-app/AGENTS.md) for commands, architecture, documentation and rules.
- **`back/`** — read [`back/AGENTS.md`](back/AGENTS.md) for commands, architecture, and testing.

## Docker

Two compose to run the web service locally

- **Dev**: `docker compose -f docker-compose.nuxt.dev.yml up` — hot-reload, bind-mounts `app/` and `server/`
- **Prod**: `docker compose -f docker-compose.nuxt.yml up` — production build

Both spin up backend (`:8080`), Postgres (`:5432`), and the Nuxt frontend (`:3000`).

Root `.env` provides Postgres credentials for Docker. Nuxt-specific env vars are in `nuxt-web-app/.env`.
