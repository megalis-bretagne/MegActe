import { getServerSession } from "#auth";

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session?.accessToken) throw createError({ statusCode: 401 });

  const query = getQuery(event);
  const { entiteId, idFlux, docsPerPage } = query;

  const config = useRuntimeConfig();
  const url = `/entite/${entiteId}/documents?offset=0&limit=${docsPerPage}${idFlux ? `&type_flux=${idFlux}` : ""}`;
  const data = await $fetch<DocumentPaginate>(url, {
    baseURL: config.public.apiBaseUrl,
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });

  return data;
});
