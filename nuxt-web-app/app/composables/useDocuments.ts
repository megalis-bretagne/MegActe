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

export const useDocuments = () => {
    const documents = ref<DocumentInfo[]>([]);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    // @ts-expect-error
    const fetchDocuments = async (
        entiteId: number,
        idFlux: string | null = null,
        offset = 0,
        limit = 100
    ) => {
        isLoading.value = true;
        error.value = null;

        try {
            const config = useRuntimeConfig();
            const { user } = useUserContext();

            let queryParams = `offset=${offset}&limit=${limit}`;
            if (idFlux) queryParams += `&type_flux=${idFlux}`;

            const data = await $fetch<DocumentPaginate>(
                `/entite/${entiteId}/documents?${queryParams}`,
                {
                    baseURL: config.public.apiBaseUrl,
                    headers: { Authorization: `Bearer ${user.value?.token}` },
                }
            );

            documents.value = (data?.documents ?? []).map((d) => ({ ...d, selected: false }));
        } catch (e: any) {
            error.value = e?.message ?? "Erreur lors du chargement des documents";
            documents.value = [];
        } finally {
            isLoading.value = false;
        }
    };

    return { documents, isLoading, error, fetchDocuments };
};