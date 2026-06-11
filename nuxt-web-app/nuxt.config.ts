import Aura from "@primeuix/themes/aura";
import PrimeUI from "tailwindcss-primeui";

export default defineNuxtConfig({
  devtools: { enabled: false },

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
      enablePeriodically: 60,
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
