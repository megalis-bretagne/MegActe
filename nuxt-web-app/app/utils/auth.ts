export const tryRefreshToken = async (): Promise<string | null> => {
  try {
    const session = await $fetch("/auth/session");
    if (session?.accessToken) {
      return session.accessToken;
    }
  } catch {
    /* ignore */
  }
  return null;
};
