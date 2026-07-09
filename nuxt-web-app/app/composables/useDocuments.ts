import { useQuery, useQueryClient } from "@tanstack/vue-query";

export interface DocumentInfo {
  id_d: string;
  id_e: string;
  titre: string;
  type: string;
  last_action: string;
  last_action_date: string;
  last_action_message: string;
  action_possible: { action: string; message: string }[];
}

export interface DocumentPaginate {
  documents: DocumentInfo[];
  pagination: { total: number; offset: number; limit: number } | null;
}

export const ITEMS_PER_PAGE = 10;

const fetchPage = async (
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
  } catch (e: any) {
    if (e?.status === 403 || e?.response?.status === 403) {
      const newToken = await tryRefreshToken();
      if (newToken) {
        return await $fetch<DocumentPaginate>(url, {
          baseURL: config.public.apiBaseUrl,
          headers: { Authorization: `Bearer ${newToken}` },
        });
      }
    }
    throw e;
  }
};

export const useDocuments = (
  entiteId: Ref<number | undefined>,
  idFlux: Ref<string | null | undefined>,
  page: Ref<number>,
  search: Ref<string>,
  limit: Ref<number> = ref(ITEMS_PER_PAGE),
  enabled: Ref<boolean> = ref(true),
) => {
  const { user } = useUserContext();
  const queryClient = useQueryClient();

  // Mémorisé après le premier chargement normal
  const knownTotal = ref(0);

  const isSearching = computed(() => !!search.value.trim());

  // En recherche : tout fetcher en une requête ; sinon pagination normale
  const effectiveOffset = computed(() =>
    isSearching.value ? 0 : (page.value - 1) * limit.value,
  );
  const effectiveLimit = computed(() =>
    isSearching.value ? knownTotal.value || limit.value : limit.value,
  );

  const queryKey = computed(() => [
    "documents",
    entiteId.value,
    idFlux.value ?? null,
    effectiveOffset.value,
    effectiveLimit.value,
  ]);

  const { data, isFetching, isError, error } = useQuery({
    queryKey,
    queryFn: () =>
      fetchPage(
        entiteId.value!,
        idFlux.value ?? null,
        effectiveOffset.value,
        effectiveLimit.value,
        user.value?.token,
      ),
    enabled: computed(
      () => !!entiteId.value && !!user.value?.token && enabled.value,
    ),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
    retry: (failureCount, error: any) => {
      if (error?.status === 403 || error?.response?.status === 403)
        return false;
      return failureCount < 1;
    },
  });

  const doPrefetch = (prefetchOffset: number, total: number) => {
    if (!entiteId.value || !user.value?.token) return;
    if (prefetchOffset < 0 || prefetchOffset >= total) return;

    const key = [
      "documents",
      entiteId.value,
      idFlux.value ?? null,
      prefetchOffset,
      limit.value,
    ];
    if (queryClient.getQueryData(key)) return;

    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () =>
        fetchPage(
          entiteId.value!,
          idFlux.value ?? null,
          prefetchOffset,
          limit.value,
          user.value?.token,
        ),
      staleTime: 60_000,
      retry: false,
    });
  };

  watch(
    data,
    (d) => {
      const total = d?.pagination?.total ?? 0;
      if (!total || isSearching.value) return;
      knownTotal.value = total;
      doPrefetch(effectiveOffset.value + limit.value, total);
      doPrefetch(effectiveOffset.value - limit.value, total);
    },
    { immediate: true },
  );

  const documents = computed(() => data.value?.documents ?? []);
  const pagination = computed(() => data.value?.pagination ?? null);

  return {
    documents,
    pagination,
    isFetching,
    isError,
    error,
  };
};
