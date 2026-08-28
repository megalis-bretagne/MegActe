export const tryRefreshToken = async (): Promise<string | null> => {
  try {
    const session = await $fetch("/auth/session");

    // session.error (RefreshAccessTokenError) : accessToken reste l'ancien token expiré (jwt
    // callback ne l'efface pas) — sans ce check on le renverrait comme valide, retry en boucle.

    if (session?.accessToken && !session?.error) {
      return session.accessToken;
    }
    if (session?.error === "RefreshAccessTokenError" && import.meta.client) {
      const { signIn } = useAuth();
      try {
        await signIn("keycloak");
      } catch (e) {
        console.error("Échec de la redirection vers la reconnexion :", e);
      }
    }
  } catch {
    /* ignore */
  }
  return null;
};
