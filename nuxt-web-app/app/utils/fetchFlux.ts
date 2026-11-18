export async function fetchFluxDetails(
  fluxType: string
): Promise<FluxDetails | null> {
  const apiFetch = useApiFetch();
  return await apiFetch<FluxDetails>(`/flux/${fluxType}`);
}
