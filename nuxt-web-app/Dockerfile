FROM node:24-trixie-slim AS base

ARG PORT=3000

WORKDIR /nuxt-app

# Build
FROM base AS build

COPY --link nuxt-web-app/package.json /nuxt-app/package.json
COPY --link nuxt-web-app/package-lock.json /nuxt-app/package-lock.json
RUN npm ci --ignore-scripts

COPY --link nuxt-web-app/ /nuxt-app/
COPY --link VERSION /nuxt-app/VERSION

RUN npm run build

# Run
FROM base

ENV PORT=$PORT
ENV NODE_ENV=production

COPY --from=build /nuxt-app/.output /nuxt-app/.output
COPY --from=build /nuxt-app/VERSION /nuxt-app/VERSION
# Optional, only needed if you rely on unbundled dependencies
# COPY --from=build /nuxt-app/node_modules /nuxt-app/node_modules

RUN chown -R node:node /nuxt-app

USER node

CMD [ "node", ".output/server/index.mjs" ]
