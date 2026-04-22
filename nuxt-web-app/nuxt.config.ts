// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  nitro: {
    preset: 'node-server',
  },
  
  // Configuration des variables d'environnement publiques
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.API_URL || 'http://localhost:8000',
    },
  },
  
  modules: [
 //   '@nuxtjs/tailwindcss',
 //   '@pinia/nuxt',        // gestion d'état
    '@sidebase/nuxt-auth', // Module d'authentification
  ],
  
  // Configuration de nuxt-auth
  auth: {
    isEnabled: true,
    globalAppMiddleware: true,
    disableServerSideAuth: false,
    originEnvKey: 'AUTH_ORIGIN',
    baseURL: process.env.APP_URL + '/auth',
    //baseURL: 'http://localhost:3000/auth',
    provider: {
      type: 'authjs',
      trustHost: false,
      defaultProvider: 'keycloak',
      addDefaultCallbackUrl: true,
    },
    sessionRefresh: {
      enablePeriodically: true,
      enableOnWindowFocus: true,
    },
  },
    
   
  // Configuration Tailwind (si utilisé)
//  tailwindcss: {
//    cssPath: '~/assets/css/tailwind.css',
//  },
  
  // Options de rendu
  ssr: true, // Active le Server-Side Rendering
  
  // Configuration des routes (optionnel)
  routeRules: {
    // Exemple : Cache statique pour certaines pages
    '/': { static: true },
  },
  
  // Suppress the module-preload-polyfill sourcemap warning
  vite: {
    build: {
      rollupOptions: {
        onLog(level, log, handler) {
          // Filter out the specific module-preload-polyfill warning
          if (log.plugin === 'nuxt:module-preload-polyfill' && log.message?.includes('Sourcemap is likely to be incorrect')) {
            return;
          }
          handler(level, log);
        },
      },
    },
  },
});
