export async function fetchUserFlux(token: string, baseURL: string): Promise<Record<string, Flux>> {
  try {
    console.log("Fetch user flux with token: " + token);
    return await $fetch("/user/flux", {
      baseURL: baseURL,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 1000,
    });
  } catch (error) {
    console.log("Failed to fetch user flux: ", error);
    return null;
  }
}

export async function fetchFluxDetails(fluxType: string, token: string): Promise<Record<string, FluxDetails>> {
  try {
    const config = useRuntimeConfig();
    console.log("Fetch flux details for type:" + fluxType);
    const fluxDetails: Record<string, FluxDetails> = await $fetch(`/flux/${fluxType}`, {
      baseURL: config.public.apiBaseUrl,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 1000,
    });
    return fluxDetails;
  } catch (error) {
    console.log("Failed to fetch flux details: ", error);
  }
}
