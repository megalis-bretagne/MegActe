//Get related pastell user from backend
export async function getPastellUser(accessToken: string): Promise<Void> {
  try {
    const config = useRuntimeConfig();
    console.log("initPastellUser with token: " + accessToken);
    const pastellUser = await $fetch("/user", {
      baseURL: config.public.apiBaseUrl,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return pastellUser;
  } catch (error) {
    console.log("Failed to fetch related Pastell user data:", error);
  }
};
