import { useQuery, useQueryClient } from "@tanstack/vue-query";

export interface DocumentInfo {
  id_d: string;
  id_e: string;
  titre: string;
  type: string;
  last_action: string;
  last_action_date: string;
  last_action_message: string;
  action_possible: { action: string; message: string }[]
}

export interface DocumentPaginate {
  documents: DocumentInfo[];
  pagination: { total: number; offset: number; limit: number } | null;
}

export const ITEMS_PER_PAGE = 10;

// Filtres avancés
export interface AdvancedFilters {
  etat?: string | null;
  etatDebut?: Date | null;
  etatFin?: Date | null;
  etatTransit?: string | null;
  etatTransitDebut?: Date | null;
  etatTransitFin?: Date | null;
}

// return les données brutes ( documents, pagination )
const fetchPage = async (
    entiteId: number,
    idFlux: string | null,
    offset: number,
    limit: number,
    search: string,
    filters: AdvancedFilters,
    token: string,
): Promise<DocumentPaginate> => {
  const config = useRuntimeConfig();

  // Construction propre et sécurisée des paramètres d'URL
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
  });

  if (idFlux) params.append("type_flux", idFlux);
  if (search.trim()) params.append("search", search.trim());
  if (filters.etat) params.append("etat", filters.etat);
  if (filters.etatDebut) params.append("etat_debut", dateToISO(filters.etatDebut));
  if (filters.etatFin) params.append("etat_fin", dateToISO(filters.etatFin));
  if (filters.etatTransit) params.append("etat_transit", filters.etatTransit);
  if (filters.etatTransitDebut) params.append("etat_transit_debut", dateToISO(filters.etatTransitDebut));
  if (filters.etatTransitFin) params.append("etat_transit_fin", dateToISO(filters.etatTransitFin));

  const url = `/entite/${entiteId}/documents?${params.toString()}`;

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

// Qui utilise fetchpage avec useQuery ( tanstack ). Gère le cache, page suivante, ... pour disponibilité
export const useDocuments = (
    entiteId: Ref<number | undefined>,
    idFlux: Ref<string | null | undefined>,
    page: Ref<number>,
    search: Ref<string>,
    limit: Ref<number> = ref(ITEMS_PER_PAGE),
    filters: Ref<AdvancedFilters> = ref({}),
    enabled: Ref<boolean> = ref(true),
) => {
  const { user } = useUserContext();
  const queryClient = useQueryClient();

  // Calcul direct de l'offset
  const offset = computed(() => (page.value - 1) * limit.value);

  // queryKey
  const queryKey = computed(() => [
    "documents",
    entiteId.value,
    idFlux.value ?? null,
    offset.value,
    limit.value,
    search.value,
    filters.value,
  ]);

  const { data, isFetching, isError, error } = useQuery({
    queryKey,
    queryFn: () =>
        fetchPage(
            entiteId.value!,
            idFlux.value ?? null,
            offset.value,
            limit.value,
            search.value,
            filters.value,
            user.value?.token!,
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
      search.value,
      filters.value,
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
              search.value,
              filters.value,
              user.value?.token!,
          ),
      staleTime: 60_000,
      retry: false,
    });
  };

  watch(
      data,
      (d) => {
        const total = d?.pagination?.total ?? 0;
        if (!total) return;
        doPrefetch(offset.value + limit.value, total);
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
