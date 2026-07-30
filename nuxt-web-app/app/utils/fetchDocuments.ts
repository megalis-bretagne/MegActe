export const fetchDocumentsPage = async (
  entiteId: number,
  idFlux: string | null,
  offset: number,
  limit: number,
  token: string,
  search?: string,
  filters?: AdvancedFilters
): Promise<DocumentPaginate> => {
  const config = useRuntimeConfig();

  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
  });
  if (idFlux) params.append("type_flux", idFlux);
  if (search?.trim()) params.append("search", search.trim());
  if (filters?.etat) params.append("etat", filters.etat);
  if (filters?.etatDebut) params.append("etat_debut", dateToISO(filters.etatDebut));
  if (filters?.etatFin) params.append("etat_fin", dateToISO(filters.etatFin));
  if (filters?.etatTransit) params.append("etat_transit", filters.etatTransit);
  if (filters?.etatTransitDebut) params.append("etat_transit_debut", dateToISO(filters.etatTransitDebut));
  if (filters?.etatTransitFin) params.append("etat_transit_fin", dateToISO(filters.etatTransitFin));

  const url = `/entite/${entiteId}/documents?${params.toString()}`;

  const doFetch = (authToken: string) =>
    $fetch<DocumentPaginate>(url, {
      baseURL: config.public.apiBaseUrl,
      headers: { Authorization: `Bearer ${authToken}` },
    });

  try {
    return await doFetch(token);
  } catch (e: any) {
    if (e?.status === 403) {
      const newToken = await tryRefreshToken();
      if (newToken) return await doFetch(newToken);
    }
    console.error("fetchDocumentsPage error", e);
    throw e;
  }
};
