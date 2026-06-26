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
    console.error("fetchDocumentsPage error", e)
    throw e;
  }
};

export const fetchDocument = async (
  entiteId: number,
  documentId: string,
  token: string,
): Promise<DocumentDetail> => {
  const config = useRuntimeConfig();
  const url = `/entite/${entiteId}/document/${documentId}`;

  try {
    const doc: DocumentDetail = await $fetch<DocumentDetail>(url, {
      baseURL: config.public.apiBaseUrl,
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("[DocumentDetail]", JSON.stringify(doc, null, 2));
    return doc;
  } catch (e) {
    console.error("fetchDocument error", e)
    throw e;
  }
};

export const fetchDocumentJournal = async (
  entiteId: number,
  documentId: string,
  token: string,
): Promise<Journal> => {
  const config = useRuntimeConfig();
  const url = `/entite/${entiteId}/document/${documentId}/journal`;

  try {
    return await $fetch<Journal>(url, {
      baseURL: config.public.apiBaseUrl,
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (e) {
    console.error("fetchDocumentJournal error", e)
    throw e;
  }
};

