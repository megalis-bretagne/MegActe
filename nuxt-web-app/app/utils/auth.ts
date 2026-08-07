export const tryRefreshToken = async (): Promise<string | null> => {
  try {
    const session = await $fetch("/auth/session");
    // session.error (RefreshAccessTokenError) : le refresh a échoué côté serveur, mais
    // accessToken reste rempli avec l'ancien token expiré (le callback jwt ne l'efface pas).
    // Sans ce check, on renverrait ce token périmé comme s'il était valide, et le retry
    // échouerait à nouveau en 403 pour la même raison.
    if (session?.accessToken && !session?.error) {
      return session.accessToken;
    }
  } catch {
    /* ignore */
  }
  return null;
};
