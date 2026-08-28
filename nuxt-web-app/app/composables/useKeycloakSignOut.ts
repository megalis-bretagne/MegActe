// signOut() seul ne coupe que la session locale (SSO Keycloak reconnecterait aussitôt) :
// on récupère l'URL de déconnexion Keycloak avant, puis on y redirige pour la terminer.
export function useKeycloakSignOut() {
  const { signOut } = useAuth();
  const loading = ref(false);

  async function handleSignOut() {
    loading.value = true;
    let keycloakLogoutUrl: string | null = null;
    try {
      const res = await $fetch<{ url: string | null }>(
        "/api/auth/keycloak-logout-url"
      );
      keycloakLogoutUrl = res.url;
    } catch (e) {
      console.error(
        "Impossible de récupérer l'URL de déconnexion Keycloak :",
        e
      );
    }

    await signOut({ callbackUrl: "/", redirect: !keycloakLogoutUrl });

    if (keycloakLogoutUrl) {
      window.location.href = keycloakLogoutUrl;
    }
    loading.value = false;
  }

  return { handleSignOut, loading };
}
