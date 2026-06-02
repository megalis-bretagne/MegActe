import Aura from "@primeuix/themes/aura";
import PrimeUI from "tailwindcss-primeui";

export default defineNuxtConfig({
  devtools: { enabled: false },

  nitro: {
    preset: "node-server",
  },

  // Configuration des variables d'environnement publiques
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.API_URL || "http://localhost:8080",
    },
  },

  modules: [
    //   '@pinia/nuxt',        // gestion d'état
    "@nuxtjs/tailwindcss",
    "@primevue/nuxt-module",
    "@sidebase/nuxt-auth",
    "@nuxt/eslint",
  ],

  // Configuration de nuxt-auth
  auth: {
    isEnabled: true,
    globalAppMiddleware: true,
    disableServerSideAuth: false,
    originEnvKey: "AUTH_ORIGIN",
    baseURL: process.env.APP_URL + "/auth",
    provider: {
      type: "authjs",
      trustHost: false,
      defaultProvider: "keycloak",
      addDefaultCallbackUrl: true,
    },
    sessionRefresh: {
      enablePeriodically: 3000,
      enableOnWindowFocus: true,
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

  eslint: {
    // options here
  },

  // Options de rendu
  ssr: true, // Active le Server-Side Rendering

  // Configuration des routes (optionnel)
  // routeRules: {
  //   // Exemple : Cache statique pour certaines pages
  //   "/": { static: true },
  // },

  // Suppress the module-preload-polyfill sourcemap warning
  vite: {
    build: {
      rollupOptions: {
        onLog(level, log, handler) {
          // Filter out the specific module-preload-polyfill warning
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
