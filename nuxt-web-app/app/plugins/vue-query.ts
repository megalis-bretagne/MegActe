import { VueQueryPlugin, QueryClient, dehydrate, hydrate } from "@tanstack/vue-query";

export default defineNuxtPlugin((nuxtApp) => {
  // Transfère le cache rempli côté serveur vers le front au montage, pour éviter que
  // chaque query SSR soit refaite une seconde fois au premier rendu client (cache vide sinon)
  // Je l'ais pris sur la doc officielle de tanstack https://tanstack.com/query/latest/docs/framework/vue/guides/ssr et adapté
  const vueQueryState = useState("vue-query");

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60000,
        retry: 1,
      },
    },
  });

  nuxtApp.vueApp.use(VueQueryPlugin, { queryClient });

  if (import.meta.server) {
    nuxtApp.hooks.hook("app:rendered", () => {
      vueQueryState.value = dehydrate(queryClient);
    });
  }

  if (import.meta.client) {
    nuxtApp.hooks.hook("app:created", () => {
      hydrate(queryClient, vueQueryState.value);
    });
  }
});
