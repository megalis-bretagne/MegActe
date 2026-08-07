export function useApiFetch() {
  const config = useRuntimeConfig();
  const { data: user } = useAuth();

  return $fetch.create({
    baseURL: config.public.apiBaseUrl,
    retry: 1,
    retryStatusCodes: [403],
    // permet de configurer baseurl et header, injecte le token courant pour l'api avant son appel vers notre backend
    async onRequest({ options }) {
      const headers = new Headers(options.headers);
      // Ne pas écraser un header déjà posé par onResponseError (token rafraîchi pour le retry)
      if (!headers.has("Authorization") && user.value?.accessToken) {
        headers.set("Authorization", `Bearer ${user.value.accessToken}`);
      }
      options.headers = headers;
    },
    // s'éxecute si le serveur return un code erreur. Comme il y'a des 403 recurent, rafraichit le token
    async onResponseError({ response, options }) {
      if (response.status !== 403) return;
      const newToken = await tryRefreshToken();
      console.log("newToken : ", newToken);
      if (!newToken) return;
      const headers = new Headers(options.headers);
      headers.set("Authorization", `Bearer ${newToken}`);
      options.headers = headers;
    },
  });
}
