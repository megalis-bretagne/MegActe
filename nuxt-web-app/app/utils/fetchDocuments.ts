export const fetchDocumentsPage = async (
  entiteId: number,
  idFlux: string | null,
  offset: number,
  limit: number,
  token: string,
): Promise<DocumentPaginate> => {
  const config = useRuntimeConfig();
  let queryParams = `offset=${offset}&limit=${limit}`;
  if (idFlux) queryParams += `&type_flux=${idFlux}`;
  const url = `/entite/${entiteId}/documents?${queryParams}`;

  try {
    return await $fetch<DocumentPaginate>(url, {
      baseURL: config.public.apiBaseUrl,
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (e) {
    console.error("fetchPage error", e)
    throw e;
  }
};


