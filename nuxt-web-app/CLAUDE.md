# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

MegActe is a Nuxt 4 front-end for Pastell, a document/workflow (télétransmission d'actes) backend used by French local authorities ("entités"). It authenticates against a Keycloak SSO server and proxies most business data through a FastAPI-style backend (`API_URL`, exposed as `runtimeConfig.public.apiBaseUrl`).

Stack: Nuxt 4, Vue 3, PrimeVue 4 (styled mode) + Tailwind CSS via `tailwindcss-primeui`, `@sidebase/nuxt-auth` (next-auth) for Keycloak OAuth, `@peterbud/nuxt-query` (TanStack/Vue Query) for data fetching/caching.

## Commands

```bash
npm run build         # production build
npm run generate       # static generation
npm run preview       # preview a production build
npm run lint           # eslint .
npm run lint:fix        # eslint . --fix
npm run format          # prettier . --check
npm run format:fix       # prettier . --write
```

There is no test suite / test runner configured in this repo.

Env vars are read from `.env` (gitignored, never commit real values): `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `KEYCLOAK_ISSUER`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`, `AUTH_SECRET`, `APP_URL`, `AUTH_ORIGIN`, `API_URL`. `API_URL` and `PASTEL_URL` (Pastell UI base URL, used to build the TDT return link) are exposed client-side via `runtimeConfig.public`.

## Architecture

### Two API layers — know which one you're in

1. **Nuxt server routes** (`server/api/**`, `server/routes/auth/[...].ts`): run server-side only, read the next-auth session directly with `getServerSession`/`getToken` from `#auth`, and call the Pastell backend with the session's `accessToken` attached manually. Used for the handful of endpoints that must run at request time (initial user/flux fetch, first documents page, Keycloak logout URL) or need server-only secrets.
2. **Client-side `useApiFetch()`** (`app/composables/useApiFetch.ts`): a `$fetch.create` instance baseURL'd to `apiBaseUrl`, used by composables (`useDocumentActions`, `useDocumentEdit`, `useDocumentSave`, `useBatchDocuments`, `useFileDownload`, `fetchFlux.ts`, etc.) to call the Pastell backend directly from pages/components (both SSR and CSR, since these composables run in `<script setup>`). It auto-attaches the current session's bearer token and retries once on 403 by calling `tryRefreshToken()` (`app/utils/auth.ts`), which hits `/auth/session` and, if the refresh itself failed server-side (`session.error === "RefreshAccessTokenError"`), forces a client-side `signIn("keycloak")`.

Don't mix them up: a new server-only endpoint goes in `server/api/`; anything called from within a Vue composable/component should go through `useApiFetch()`.

### Auth flow (Keycloak via next-auth)

- `@sidebase/nuxt-auth`'s built-in global middleware is **disabled** (`globalAppMiddleware: false` in `nuxt.config.ts`) because it calls `signIn()` server-side, which fails NextAuth's CSRF check in SSR. It's replaced by `app/middleware/auth.global.ts`, which redirects unauthenticated users to `/login`; `login.vue` triggers `signIn("keycloak")` client-side instead.
- `server/routes/auth/[...].ts` is the NextAuth catch-all handler: builds/refreshes the JWT (`refreshAccessToken`), and stores `idToken` on the token (needed for real Keycloak logout via `server/api/auth/keycloak-logout-url.get.ts`, since next-auth's `signOut()` only clears the local session).
- Token refresh on 403: `useApiFetch()`'s `onResponseError` + `tryRefreshToken()` (see above). Keep both server-side (`jwt` callback expiry check) and client-side (403 retry) refresh paths in mind when touching auth.
- `app/middleware/init-user.global.ts` fetches `/api/user` once per session and seeds the global state (`usePastellUser`, `useSelectedEntiteId`, `useSelectedFlux` in `app/composables/states.ts`).

### SSR data fetching pattern

Pages/components that need data ready before hydration (`DocumentDetail.vue`, `useDocumentEdit.ts`) manually `await queryClient.prefetchQuery(...)` guarded by `import.meta.server` before calling `useQuery`. The `await` is caught by the root `<Suspense>` Nuxt wraps around `<NuxtPage>`, so the page blocks on the server until the query is populated — otherwise Vue Query only _starts_ the fetch during SSR without awaiting it, and the UI stays empty until client hydration despite `ssr: true`. Follow this pattern (prefetch on server, `enabled` guard using `!!user.value?.accessToken`) whenever adding a new query that must not flash empty on first paint.

### Document flux/form system

Document types ("flux") are described by a Pastell-provided schema (`FluxDetails`, cached in-memory + `localStorage` for 24h by `useFluxDef.ts`) merged with static local config:

- `app/utils/flux-tabs.ts` (`FLUX_TABS_CONFIG`) defines which tabs/fields a given flux type shows, shared by both the edit form and the read-only detail view.
- `app/utils/flux-form.ts` holds field-level overrides (`FORM_TAB_FIELD_OVERRIDES`), defaults (`FORM_DEFAULTS`), and form validation/file helpers.
- `app/composables/useDocumentEdit.ts` builds the reactive tab/field list for a given flux + doc, handles file selection and "external data" fields (dialogs backed by Pastell lookups). `app/composables/useDocumentSave.ts` owns the actual save/send mutation (multi-phase: `step1` / `single-send` / `step2-save` / `step2-send`) and client-side validation. They're split so the (large) save/validation logic isn't tangled with form-state construction; both are composed together from the edit page.
- Some flux types have a two-step form (TDT flux: form fields, then attachment "type_piece" classification) — driven by `hasStepTdt` (`fluxDef.value["type_piece"]` present).
- `app/utils/documentType.ts` / `app/utils/fluxType.ts` / `app/utils/actionType.ts` / `app/utils/journalType.ts` / `app/utils/userType.ts` hold the shared domain types (`DocumentDetail`, `DocumentInfo`, `FluxDetails`, etc.). These are consumed unimported across composables/components — Nuxt's auto-import picks up `export interface`/`export type` from `app/utils/**` the same way it does functions, so no explicit `import` is needed nor expected for these types.

### Document actions (state machine)

Pastell documents move through a `last_action`/`action_possible` state machine. `app/composables/useDocumentActions.ts` (single document) and `app/composables/useBatchDocuments.ts` (list/batch) both POST to `/entite/{id}/documents/perform_action` and then poll (`waitForActionSync`, exponential-ish backoff up to 30s) until `last_action` stabilizes, since Pastell processes some actions asynchronously. `app/utils/documentActions.ts` centralizes action metadata (icons, severity, which actions are batchable/duplicable) and the "teletransmission-tdt" redirect URL builder (redirects out to Pastell/TDT and back via `retour-tdt.vue`).

### Path aliasing / structure

Follows standard Nuxt 4 `app/` directory layout (see `AGENTS.md`): `app/app.vue` is the entry point, routing is file-based under `app/pages/` (dynamic routes: `org/[entiteId]/document/[idD]/{index,edit}.vue`). `shared/` holds code usable from both `app/` and `server/` (currently just `shared/utils/error.ts`, the `getErrorDetail` helper used throughout catch blocks).

## Conventions from AGENTS.md

- PrimeVue is used in **styled mode** with Tailwind integration (`@nuxtjs/tailwindcss` + `tailwindcss-primeui`, `darkModeSelector: ".p-dark"`) — don't add unstyled/custom CSS overrides that fight the Aura theme.
- Nuxt.js, PrimeVue, and Tailwind CSS MCP servers are configured — prefer them over guessing API surface for these libraries.
- When searching with `find`, exclude `node_modules/`.
