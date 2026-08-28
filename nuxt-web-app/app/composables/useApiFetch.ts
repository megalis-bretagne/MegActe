export function useApiFetch() {
  const config = useRuntimeConfig();
  const { data: user } = useAuth();
  const nuxtApp = useNuxtApp();

  return $fetch.create({
    baseURL: config.public.apiBaseUrl,
    retry: 1,
    retryStatusCodes: [403],
    async onRequest({ options }) {
      const headers = new Headers(options.headers);
      // Ne pas écraser un header déjà posé par onResponseError (token rafraîchi pour le retry)
      if (!headers.has("Authorization") && user.value?.accessToken) {
        headers.set("Authorization", `Bearer ${user.value.accessToken}`);
      }
      options.headers = headers;
    },
    async onResponseError({ response, options }) {
      if (response.status !== 403) return;
      // runWithContext requis : ce hook peut tourner après le setup (ex: polling par setTimeout),
      // où le contexte Nuxt est perdu et useAuth() planterait sinon ("called outside...").
      const newToken = await nuxtApp.runWithContext(() => tryRefreshToken());
      if (!newToken) return;
      const headers = new Headers(options.headers);
      headers.set("Authorization", `Bearer ${newToken}`);
      options.headers = headers;
    },
  });
}
