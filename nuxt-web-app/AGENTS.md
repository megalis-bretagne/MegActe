# AGENTS.md

## Project Overview

Current repository is a Nuxt.js webapp. Nuxt 4.x is used.
It is using Primevue as component library with Tailwindcss in styled mode.

## Project Structure

Structure follows what is described in the official documentation here (<https://nuxt.com/docs/4.x/directory-structure>)

### Nuxt configuration

Nuxt configuration is in @./nuxt.config.ts

### App entry point

The app entry point is @./app/app.vue

## Authentication module

"@sidebase/nuxt-auth" is used to managed authentication against our keycloak server.
The configuration is in the auth section of nuxt.config.ts.
A catch-all route has been added into @./server/routes/auth/\[...\].ts
A composable to retrieve authenticated user information is available in @./app/composables/useUserContext.ts

## Primevue and Tailwindcss integration

Tailwindcss is integrated to Primevue in styled mode. So @nuxtjs/tailwindcss and tailwindcss-primeui packages are used.

## MCP servers

3 MCP servers are configured:

- Nuxt.js MCP
- Primevue MCP
- Tailwindcss MCP

Please use those MCP servers to get up-to-date documentation when you generate code.

## Searching for files (find command)

When you search for files using for instance find command, don't search into @./node_modules/ directory
