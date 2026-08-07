export async function fetchUserFlux(
  token: string,
  baseURL: string
): Promise<Record<string, Flux> | null> {
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

export async function fetchFluxDetails(fluxType: string): Promise<FluxDetails | null> {
  const apiFetch = useApiFetch();
  return await apiFetch<FluxDetails>(`/flux/${fluxType}`);
}
