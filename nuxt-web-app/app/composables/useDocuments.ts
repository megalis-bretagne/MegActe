export const ITEMS_PER_PAGE = 20;

export const useDocuments = (
  entiteId: Ref<number | undefined>,
  idFlux: Ref<string | null | undefined>,
  page: Ref<number>,
  search: Ref<string>,
) => {
  const { user } = useUserContext();
  const queryClient = useQueryClient();

  // Mémorisé après le premier chargement normal
  const knownTotal = ref(0);

  const isSearching = computed(() => !!search.value.trim());

  // En recherche : tout fetcher en une requête ; sinon pagination normale
  const effectiveOffset = computed(() =>
    isSearching.value ? 0 : (page.value - 1) * ITEMS_PER_PAGE,
  );
  const effectiveLimit = computed(() =>
    isSearching.value ? knownTotal.value || ITEMS_PER_PAGE : ITEMS_PER_PAGE,
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
        user.value?.token,
      ),
    enabled: computed(() => !!entiteId.value && !!user.value?.token),
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
      ITEMS_PER_PAGE,
    ];

    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () =>
        fetchPage(
          entiteId.value!,
          idFlux.value ?? null,
          prefetchOffset,
          ITEMS_PER_PAGE,
          user.value?.token,
        ),
    });
  };

  watch(
    data,
    (d) => {
      const total = d?.pagination?.total ?? 0;
      if (!total || isSearching.value) return;
      knownTotal.value = total;
      doPrefetch(effectiveOffset.value + ITEMS_PER_PAGE, total);
      doPrefetch(effectiveOffset.value - ITEMS_PER_PAGE, total);
    },
    { immediate: true },
  );

  const documents = computed(() =>
    (data.value?.documents ?? []).map((d) => ({ ...d, selected: false })),
  );
  const pagination = computed(() => data.value?.pagination ?? null);
  const totalPages = computed(() =>
    pagination.value ? Math.ceil(pagination.value.total / ITEMS_PER_PAGE) : 0,
  );

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["documents", entiteId.value] });

  return {
    documents,
    pagination,
    totalPages,
    isFetching,
    isError,
    error,
    invalidate,
  };
};
