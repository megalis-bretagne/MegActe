export async function fetchUserFlux(token: string): Promise<Record<string, Flux>> {
  try {
    const config = useRuntimeConfig();
    console.log("Fetch user flux with token: " + token);
    const flux: Record<string, Flux> = await $fetch("/user/flux", {
      baseURL: config.public.apiBaseUrl,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 1000,
    });
    return flux;
  } catch (error) {
    console.log("Failed to fetch user flux: ", error);
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
