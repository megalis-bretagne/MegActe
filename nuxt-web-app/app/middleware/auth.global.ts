// Remplace le middleware intégré de @sidebase/nuxt-auth : signIn() appelé côté serveur (SSR)
// échoue la validation CSRF de NextAuth. On redirige vers /login, qui l'appelle côté client.
export default defineNuxtRouteMiddleware((to) => {
  const { status, signIn } = useAuth();
  if (
    status.value === "authenticated" ||
    to.matched.length === 0 ||
    to.path === "/login"
  )
    return;

  // Déjà côté client (token expiré en session) : signIn() direct, /login
  if (import.meta.client) {
    signIn("keycloak", { callbackUrl: to.fullPath });
    return false;
  }

  return navigateTo({ path: "/login", query: { callbackUrl: to.fullPath } });
});
