export function useDocumentSave(
    props: { entiteId: number; idD: string; fluxType?: string },
    state: {
        isNew: Ref<boolean>;
        createdDocId: Ref<string | null>;
        formData: Ref<Record<string, any>>;
        pendingFiles: Ref<Record<string, File[]>>;
        tabs: Ref<any[]>;
        fluxDef: Ref<Record<string, any>>;
    },
    fetchWithRefresh: <T>(url: string, opts?: any) => Promise<T>
) {
    const config = useRuntimeConfig();
    const router = useRouter();
    const { data: user } = useAuth();
    const authHeaders = computed(() => ({ Authorization: `Bearer ${user.value?.accessToken}` }));
    const queryClient = useQueryClient();
    const saveError = ref<string | null>(null);

    async function ensureDocExists(): Promise<string> {
        if (!state.isNew.value) return props.idD;
        if (state.createdDocId.value) return state.createdDocId.value;

        const response = await $fetch<any>(`/entite/${props.entiteId}/document`, {
            method: "POST",
            baseURL: config.public.apiBaseUrl,
            headers: authHeaders.value,
            body: { flux_type: props.fluxType, doc_info: {} },
        });
        state.createdDocId.value = response.info.id_d;
        return state.createdDocId.value;
    }

    const { mutateAsync: saveDoc, isPending: saving } = useMutation({
        mutationFn: async () => {
            const idD = await ensureDocExists();

            const textData: Record<string, any> = {};
            for (const tab of state.tabs.value) {
                for (const key of tab.fields) {
                    const def = state.fluxDef.value[key];
                    if (!def || def.type === "file" || key === "type_piece") continue;
                    if (state.formData.value[key] !== undefined) textData[key] = state.formData.value[key];
                }
            }

            await fetchWithRefresh(`/entite/${props.entiteId}/document/${idD}`, {
                method: "PATCH",
                body: { doc_info: textData },
            });

            for (const [key, files] of Object.entries(state.pendingFiles.value)) {
                if (!files.length) continue;
                const fieldDef = state.fluxDef.value[key];
                const isMultiple = fieldDef?.multiple ?? false;
                const form = new FormData();
                for (const file of files) form.append("files", file, file.name);

                const uploadUrl = `${config.public.apiBaseUrl}/entite/${props.entiteId}/document/${idD}/file/${key}${isMultiple ? "" : "?replace=true"}`;
                const uploadRes = await fetch(uploadUrl, {
                    method: "POST",
                    headers: authHeaders.value,
                    body: form,
                });

                if (!uploadRes.ok) {
                    let detail = `Erreur lors de l'upload du fichier (${uploadRes.status})`;
                    try { detail = (await uploadRes.json())?.detail ?? detail; } catch {}
                    throw new Error(detail);
                }
            }

            const typePiece = state.formData.value.type_piece;
            if (typePiece) {
                const rawPieces = Array.isArray(typePiece) ? typePiece : [typePiece];
                const codes = rawPieces.map((p: string) => p.match(/\(([^)]+)\)$/)?.[1] ?? p);
                await fetchWithRefresh(`/entite/${props.entiteId}/document/${idD}/externalData/type_piece`, {
                    method: "PATCH",
                    body: codes,
                });
            }

            return idD;
        },
        onSuccess: (idD) => {
            queryClient.invalidateQueries({ queryKey: ["document", props.entiteId, idD] });
            navigateTo(`/org/${props.entiteId}/document/${idD}?type=${props.fluxType ?? ""}`);
        },
        onError: (e: any) => {
            saveError.value = e?.data?.detail ?? e?.message ?? "Erreur lors de la sauvegarde";
        },
    })

    async function save() {
        saveError.value = null;

        const numeroActeError = validateNumeroActe(state.formData.value.numero_de_lacte);
        if (numeroActeError) {
            saveError.value = `Numéro d'acte : ${numeroActeError}`;
            return;
        }
        const objetError = validateObjet(state.formData.value.objet);
        if (objetError) {
            saveError.value = `Objet : ${objetError}`;
            return;
        }

        const allPendingFiles = Object.values(state.pendingFiles.value).flat();
        if (allPendingFiles.length) {
            const nonPdf = findNonPdfFileName(allPendingFiles);
            if (nonPdf) {
                saveError.value = `Le fichier « ${nonPdf} » n'est pas au format PDF. Seul le format PDF est accepté.`;
                return;
            }
            const duplicate = findDuplicateFileName(allPendingFiles);
            if (duplicate) {
                saveError.value = `Le fichier « ${duplicate} » est déposé plusieurs fois. Merci de ne pas télétransmettre 2 fois le même document (acte ou annexe), pour éviter les erreurs d'archivage.`;
                return;
            }
            const totalSize = allPendingFiles.reduce((sum, f) => sum + f.size, 0);
            if (totalSize > MAX_TOTAL_FILES_SIZE_BYTES) {
                saveError.value = `La taille totale des documents (acte + annexes) dépasse 150 Mo (${(totalSize / (1024 * 1024)).toFixed(1)} Mo).`;
                return;
            }
        }

        for (const tab of state.tabs.value) {
            for (const key of tab.fields) {
                const def = state.fluxDef.value[key];
                if (!def?.requis || key === "type_piece") continue;

                const isEmpty = def.type === "file"
                    ? !state.pendingFiles.value[key]?.length && !state.formData.value[key]
                    : !state.formData.value[key] || (Array.isArray(state.formData.value[key]) && !state.formData.value[key].length) || state.formData.value[key] === "";

                if (isEmpty) {
                    saveError.value = `Le formulaire est incomplet : le champ « ${def.name ?? key.replace(/_/g, " ")} » est obligatoire.`
                    return;
                }
            }
        }
        await saveDoc();
    }

    return { save, saving, saveError };
}