export const tryRefreshToken = async (): Promise<string | null> => {
  try {
    const session = await $fetch<any>("/auth/session");
    if (session?.accessToken) {
      const { user } = useUserContext();
      user.value = { ...user.value, token: session.accessToken };
      return session.accessToken;
    }
  } catch {
    /* ignore */
  }
  return null;
};
