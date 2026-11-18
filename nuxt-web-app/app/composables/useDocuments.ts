export const ITEMS_PER_PAGE = 10;

export const useDocuments = (
  entiteId: Ref<number | null>,
  idFlux: Ref<string | null>,
  page: Ref<number>,
  search: Ref<string>,
  limit: Ref<number> = ref(ITEMS_PER_PAGE),
  filters: Ref<AdvancedFilters> = ref({})
) => {
  const { data: user } = useAuth();

  const offset = computed(() => (page.value - 1) * limit.value);

  const buildKey = (targetOffset: number) => [
    "documents",
    entiteId.value,
    idFlux.value ?? null,
    targetOffset,
    limit.value,
    search.value,
    toRaw(filters.value),
  ];

  const queryKey = computed(() => buildKey(offset.value));

  const { data, isFetching, isError, error } = useQuery({
    queryKey,
    queryFn: () =>
      fetchDocumentsPage(
        entiteId.value!,
        idFlux.value ?? null,
        offset.value,
        limit.value,
        search.value,
        filters.value
      ),
    enabled: computed(() => !!entiteId.value && !!user.value?.accessToken),
    staleTime: 10_000,
    placeholderData: (prev) => prev,
    retry: shouldRetry,
  });

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
