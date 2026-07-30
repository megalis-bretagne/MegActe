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
      apiBaseUrl: "http://localhost:8080", // can be overridden by NUXT_PUBLIC_API_BASE_URL environment variable
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
    globalAppMiddleware: true,
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
    /**
     * Specify which Vue Query composables to auto-import
     * Default: `false`, set to `true` to auto-import all Vue Query composables
     */
    autoImports: ["useQueryClient", "useQuery", "useMutation"],

    // Enable/disable Nuxt DevTools integration (default: true)
    devtools: false,

    /**
     * These are the same options as the QueryClient
     * from @tanstack/vue-query, which will be passed
     * to the QueryClient constructor
     * More details: https://tanstack.com/query/v5/docs/reference/QueryClient
     *
     * queryClient options described here:
     * https://tanstack.com/query/latest/docs/framework/react/reference/useQuery
     */

    queryClientOptions: {
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          staleTime: 60_000,
          //refetchInterval: 5000,
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
