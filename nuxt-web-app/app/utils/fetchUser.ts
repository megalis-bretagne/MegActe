export async function fetchUser(token: string): Promise<UserSession> {
  try {
    const config = useRuntimeConfig();
    console.log("Fetch user with token: " + token);
    const user = await $fetch("/user", {
      baseURL: config.public.apiBaseUrl,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 1000,
    });
    return user;
  } catch (error) {
    console.log("Failed to fetch related Pastell user data:", error);
  }
}
