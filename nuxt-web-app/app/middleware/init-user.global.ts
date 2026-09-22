// Suppose auth.global.ts déjà exécuté (ordre alphabétique des middlewares globaux, "auth" <
// "init-user") — casse silencieusement si l'un des deux fichiers est renommé.
export default defineNuxtRouteMiddleware(async (to) => {
  // Pages sans session : la page d'erreur et la page de login (pas encore de token).
  // Sans ce garde, le fetch /api/user échouait en 401 (aucune session dans le cookie)
  // à la première connexion, loggé en erreur par le handler Ni'tro avant même le backend.
  if (to.path === "/acces-refuse" || to.path === "/login") return;

  const { status } = useAuth();
  // Pas de session valide : auth.global.ts déclenche déjà le login/signIn.
  if (status.value !== "authenticated") return;

  const user = usePastellUser();
  const entityId = useSelectedEntiteId();
  const flux = useSelectedFlux();

  // Skip if already initialized (prevents duplicate fetches on client-side navigation)
  if (!user.value) {
    try {
      const { data, error } = await useFetch("/api/user");

      if (error.value) {
        // 401 : session absente ou token expiré — la re-auth est gérée par auth.global.ts.
        if (error.value.statusCode === 401) return;
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
