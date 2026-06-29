export async function fetchUser(token: string, baseURL: string): Promise<pastellUser> {
  try {
    console.log("Fetch user with token: " + token);
    return await $fetch("/user", {
      baseURL: baseURL,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 1000,
    });
  } catch (error) {
    console.log("Failed to fetch related Pastell user data:", error);
    return null;
  }
}
