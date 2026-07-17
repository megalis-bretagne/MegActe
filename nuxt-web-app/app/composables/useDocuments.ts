export const ITEMS_PER_PAGE = 20;

export const useDocuments = (
  entiteId: Ref<number | null>,
  idFlux: Ref<string | null>,
  firstPage: Ref<DocumentPaginate | undefined>,
  page: Ref<number>,
  search: Ref<string>,
  limit: Ref<number> = ref(ITEMS_PER_PAGE)
) => {
  const { data: user } = useAuth();
  const queryClient = useQueryClient();

  // Mémorisé après le premier chargement normal
  const knownTotal = ref(0);

  const isSearching = computed(() => !!search.value.trim());

  // En recherche : tout fetcher en une requête ; sinon pagination normale
  const effectiveOffset = computed(() =>
    isSearching.value ? 0 : (page.value - 1) * limit.value
  );
  const effectiveLimit = computed(() =>
    isSearching.value ? knownTotal.value || limit.value : limit.value
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
      fetchDocumentsPage(
        entiteId.value!,
        idFlux.value ?? null,
        effectiveOffset.value,
        effectiveLimit.value,
        user.value?.accessToken
      ),
    enabled: computed(() => !!entiteId.value && !!user.value?.accessToken),
    initialData: firstPage,
    placeholderdata: (prev) => prev,
    retry: (failurecount, error: any) => {
      if (error?.status === 403 || error?.response?.status === 403)
        return false;
      return failurecount < 1;
    },
  });

  const doPrefetch = (prefetchOffset: number, total: number) => {
    if (!entiteId.value || !user.value?.accessToken) return;
    if (prefetchOffset < 0 || prefetchOffset >= total) return;

    const key = [
      "documents",
      entiteId.value,
      idFlux.value ?? null,
      prefetchOffset,
      limit.value,
    ];

    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () =>
        fetchDocumentsPage(
          entiteId.value!,
          idFlux.value ?? null,
          prefetchOffset,
          limit.value,
          user.value?.accessToken
        ),
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
    { immediate: true }
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
