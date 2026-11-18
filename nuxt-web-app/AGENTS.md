# AGENTS.md — Nuxt frontend

## Stack

- Nuxt 4
- Vue 3
- PrimeVue 4 (styled mode) + Tailwind CSS via `tailwindcss-primeui`
- `@sidebase/nuxt-auth` (next-auth) for Keycloak OAuth
- `@peterbud/nuxt-query` (TanStack/Vue Query) for data fetching/caching

## Commands

Build: `npm run build`
Lint: `npm run lint`
Format: `npm run format`
Typecheck: `npm run typecheck`

**No test suite** exists.

## Code style

- TypeScript with strict mode enabled.
- No `any` types.
- Named exports only.
- Interfaces over type aliases for object shapes.
- Use `const` by default; `let` only when reassignment is necessary.

## Architecture

- `app/` - main directory of the Nuxt application
- `app/app.vue` is the entry point of the Nuxt application
- `app/pages` - file-based routing directory
- `app/composables` - Vue composables - are auto-imported
- `app/components` - Vue components - Nuxt automatically imports any components in this directory
- `app/layout` - Layouts framework to extract common UI patterns into reusable layouts
- `app/utils` - Utility functions - are auto-imported throughout the application
- `server` - directory that contains the server-side code of the Nuxt application
- `shared` - directory that contains the shared code of the Nuxt application and Nuxt server

## Nuxt MCP server

If Nuxt MCP server is configured, use it in priority for Nuxt documentation. Filter documentation for the relevant Nuxt version.

## Rules

- **PrimeVue in styled mode** with Tailwind (`tailwindcss-primeui`, Aura theme, dark mode via `.p-dark`). Don't add unstyled CSS overrides that fight the theme.
- Code Format (**Prettier**): Follow rules described in file `.prettierrc`
- Run `npm run lint`, `npm run typecheck` and `npm run format` before declaring work complete.
- When searching with `find`, exclude `node_modules/`
