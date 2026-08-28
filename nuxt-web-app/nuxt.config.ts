import Aura from "@primeuix/themes/aura";
import PrimeUI from "tailwindcss-primeui";

export default defineNuxtConfig({
  compatibilityDate: "2026-06-24",
  devtools: { enabled: true },

  nitro: {
    preset: "node-server",
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.API_URL || "http://localhost:8080",
      pastellUrl:
        process.env.PASTEL_URL || "https://pastell.megalis.bretagne.bzh",
    },
  },

  modules: [
    "@nuxtjs/tailwindcss",
    "@primevue/nuxt-module",
    "@sidebase/nuxt-auth",
    "@peterbud/nuxt-query",
    "@nuxt/eslint",
  ],

  auth: {
    isEnabled: true,
    // Le middleware intégré appelle signIn() sans provider (atterrit sur la page générique
    // NextAuth) : remplacé par middleware/auth.global.ts qui cible "keycloak" explicitement.
    globalAppMiddleware: false,
    disableServerSideAuth: false,
    originEnvKey: "AUTH_ORIGIN",
    baseURL: "/auth",
    provider: {
      type: "authjs",
      trustHost: false,
      defaultProvider: "keycloak",
      addDefaultCallbackUrl: true,
    },
    sessionRefresh: {
      enablePeriodically: 30000,
      enableOnWindowFocus: true,
    },
  },

  nuxtQuery: {
    autoImports: ["useQueryClient", "useQuery", "useMutation"],
    devtools: false,

    queryClientOptions: {
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          staleTime: 60_000,
        },
      },
    },
  },

  primevue: {
    options: {
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: ".p-dark",
        },
      },
      ripple: true,
    },
    autoImport: false,
  },

  css: ["primeicons/primeicons.css"],
  tailwindcss: {
    config: {
      plugins: [PrimeUI],
      darkMode: ["class", ".p-dark"],
    },
  },

  eslint: {},

  ssr: true,

  vite: {
    build: {
      rollupOptions: {
        onLog(level, log, handler) {
          if (
            log.plugin === "nuxt:module-preload-polyfill" &&
            log.message?.includes("Sourcemap is likely to be incorrect")
          ) {
            return;
          }
          handler(level, log);
        },
      },
    },
  },
});
