//Get related pastell user from backend
export async function getPastellUser(accessToken: string): Promise<any> {
  try {
    const config = useRuntimeConfig();
    const pastellUser = await $fetch("/user", {
      baseURL: config.public.apiBaseUrl,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      timeout: 1000,
    });
    return pastellUser;
  } catch (error) {
    console.log("Failed to fetch related Pastell user data:", error);
  }
}
