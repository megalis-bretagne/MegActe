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

  const queryKey = computed(() => [
    "documents",
    entiteId.value,
    idFlux.value ?? null,
    offset.value,
    limit.value,
    search.value,
    toRaw(filters.value),
  ]);

  const { data, isFetching, isError, error } = useQuery({
    queryKey,
    queryFn: () =>
      fetchDocumentsPage(
        entiteId.value!,
        idFlux.value ?? null,
        offset.value,
        limit.value,
        user.value?.accessToken,
        search.value,
        filters.value
      ),
    enabled: computed(() => !!entiteId.value && !!user.value?.accessToken),
    placeholderData: (prev) => prev,
    retry: (failurecount, error) => {
      if (error?.status === 403 || error?.response?.status === 403)
        return false;
      return failurecount < 1;
    },
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
