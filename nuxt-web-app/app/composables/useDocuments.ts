import { useQuery, useQueryClient } from '@tanstack/vue-query';

export interface DocumentInfo {
    id_d: string;
    id_e: string;
    titre: string;
    type: string;
    last_action: string;
    last_action_date: string;
    last_action_message: string;
    action_possible: { action: string; message: string }[];
    selected: boolean;
}

export interface DocumentPaginate {
    documents: DocumentInfo[];
    pagination: { total: number; offset: number; limit: number } | null;
}

export const ITEMS_PER_PAGE = 20;

const refreshToken = async (): Promise<string | null> => {
    try {
        const session = await $fetch<any>('/auth/session');
        if (session?.accessToken) {
            const { user } = useUserContext();
            user.value = { ...user.value, token: session.accessToken };
            return session.accessToken;
        }
    } catch { /* ignore */ }
    return null;
};

const fetchPage = async (
    entiteId: number,
    idFlux: string | null,
    offset: number,
    limit: number,
    token: string
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
            const newToken = await refreshToken();
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
    page: Ref<number>
) => {
    const { user } = useUserContext();
    const queryClient = useQueryClient();

    const offset = computed(() => (page.value - 1) * ITEMS_PER_PAGE);

    const queryKey = computed(() => [
        'documents',
        entiteId.value,
        idFlux.value ?? null,
        offset.value,
    ]);

    const { data, isFetching, isError, error } = useQuery({
        queryKey,
        queryFn: () => fetchPage(
            entiteId.value!,
            idFlux.value ?? null,
            offset.value,
            ITEMS_PER_PAGE,
            user.value?.token
        ),
        enabled: computed(() => !!entiteId.value && !!user.value?.token),
        staleTime: 60_000,
        placeholderData: (prev) => prev,
        retry: (failureCount, error: any) => {
            if (error?.status === 403 || error?.response?.status === 403) return false;
            return failureCount < 1;
        },
    });

    const doPrefetch = (prefetchOffset: number, total: number) => {
        if (!entiteId.value || !user.value?.token) return;
        if (prefetchOffset < 0 || prefetchOffset >= total) return;

        const key = ['documents', entiteId.value, idFlux.value ?? null, prefetchOffset];
        // Ne prefetch que si pas déjà en cache
        const cached = queryClient.getQueryData(key);
        if (cached) return;

        queryClient.prefetchQuery({
            queryKey: key,
            queryFn: () => fetchPage(
                entiteId.value!,
                idFlux.value ?? null,
                prefetchOffset,
                ITEMS_PER_PAGE,
                user.value?.token
            ),
            staleTime: 60_000,
        });
    };

    // Prefetch pages adjacentes dès que total est connu
    watch(data, (d) => {
        const total = d?.pagination?.total ?? 0;
        if (!total) return;
        // Page suivante
        doPrefetch(offset.value + ITEMS_PER_PAGE, total);
        // Page précédente (utile si l'utilisateur revient en arrière)
        doPrefetch(offset.value - ITEMS_PER_PAGE, total);
    }, { immediate: true });

    const documents = computed(() =>
        (data.value?.documents ?? []).map((d) => ({ ...d, selected: false }))
    );
    const pagination = computed(() => data.value?.pagination ?? null);
    const totalPages = computed(() =>
        pagination.value ? Math.ceil(pagination.value.total / ITEMS_PER_PAGE) : 0
    );

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: ['documents', entiteId.value] });

    return { documents, pagination, totalPages, isFetching, isError, error, invalidate };
};