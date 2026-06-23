export async function fetchUserFlux(token: string): Promise<any> {
  try {
    const config = useRuntimeConfig();
    console.log("Fetch user flux with token: " + token);
    const flux = await $fetch("/user/flux", {
      baseURL: config.public.apiBaseUrl,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 1000,
    });
    return flux;
  } catch (error) {
    console.log("Failed to fetch related Pastell user data:", error);
  }
}
