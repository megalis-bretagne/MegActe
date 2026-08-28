// Suppose auth.global.ts déjà exécuté (ordre alphabétique des middlewares globaux, "auth" <
// "init-user") — casse silencieusement si l'un des deux fichiers est renommé.
export default defineNuxtRouteMiddleware(async (to) => {
  // Évite une boucle de redirection une fois sur la page d'erreur elle-même.
  if (to.path === "/acces-refuse") return;

  const user = usePastellUser();
  const entityId = useSelectedEntiteId();
  const flux = useSelectedFlux();

  // Skip if already initialized (prevents duplicate fetches on client-side navigation)
  if (!user.value) {
    try {
      const { data, error } = await useFetch("/api/user");

      if (error.value) {
        console.error("Failed to fetch user:", error.value);
        // 404 : compte Keycloak valide mais absent côté Pastell. Sans redirection, l'appli
        // restait bloquée sur des skeletons vides sans jamais expliquer pourquoi.
        if (error.value.statusCode === 404) {
          return navigateTo("/acces-refuse");
        }
        return;
      }

      if (data.value) {
        user.value = data.value;
        entityId.value = data.value.user_info?.id_e ?? null;
        flux.value =
          data.value.user_info?.default_flux ??
          data.value.user_info?.flux ??
          null;
      }
    } catch (e) {
      console.error("Middleware init error:", e);
    }
  }
});
