import type { FetchError } from "ofetch";

type SavePhase = "step1" | "single-send" | "step2-save" | "step2-send";

export function useDocumentSave(
    props: { entiteId: number; idD: string; fluxType?: string },
    state: {
        isNew: Ref<boolean>;
        createdDocId: Ref<string | null>;
        formData: Ref<FormData>;
        pendingFiles: Ref<Record<string, File[]>>;
        tabs: Ref<TabConfig[]>;
        fluxDef: Ref<FluxDetails>;
        hasStepTdt: Ref<boolean>;
        currentStep: Ref<number>;
        step2Ready: Ref<boolean>;
        typePieceItems: Ref<{ piece: string; label: string }[]>;
        fetchTypePieceMeta: () => Promise<{ ok: true; data: TypePieceMeta } | { ok: false; error: string }>;
        buildTypePieceItems: (data: TypePieceMeta) => void;
    }
) {
    const queryClient = useQueryClient();
    const apiFetch = useApiFetch();
    const saveError = ref<string | null>(null);
    // Quel bouton précisément est en cours (pour n'afficher le spinner que sur celui-ci,
    // `saving` restant vrai pour les deux tant que la mutation tourne, afin de les désactiver)
    const activePhase = ref<SavePhase | null>(null);

    async function ensureDocExists(): Promise<string> {
        if (!state.isNew.value) return props.idD;
        if (state.createdDocId.value) return state.createdDocId.value;

        const response = await apiFetch<DocumentDetail>(`/entite/${props.entiteId}/document`, {
            method: "POST",
            body: { flux_type: props.fluxType, doc_info: {} },
        });
        state.createdDocId.value = response.info.id_d;
        return state.createdDocId.value;
    }

    const { mutateAsync: saveDoc, isPending: saving } = useMutation({
        mutationFn: async (opts: { phase: SavePhase }) => {
            const idD = await ensureDocExists();
            const wantsTypePieceMeta = opts.phase === "step1" && state.hasStepTdt.value;

            if (opts.phase === "step1" || opts.phase === "single-send") {
                const textData: Record<string, string> = {};
                for (const tab of state.tabs.value) {
                    for (const key of tab.fields) {
                        const def = state.fluxDef.value[key];
                        if (!def || def.type === "file" || key === "type_piece") continue;
                        if (state.formData.value[key] !== undefined) textData[key] = state.formData.value[key];
                    }
                }

                const patchPromise = apiFetch(`/entite/${props.entiteId}/document/${idD}`, {
                    method: "PATCH",
                    body: { doc_info: textData },
                });

                // Chaque champ fichier est uploadé en parallèle des autres (et du PATCH ci-dessus)
                // plutôt qu'en séquence.
                const uploadPromises = Object.entries(state.pendingFiles.value)
                    .filter(([, files]) => files.length)
                    .map(async ([key, files]) => {
                        const fieldDef = state.fluxDef.value[key];
                        const isMultiple = fieldDef?.multiple ?? false;
                        const form = new FormData();
                        for (const file of files) form.append("files", file, file.name);

                        try {
                            await apiFetch(`/entite/${props.entiteId}/document/${idD}/file/${key}`, {
                                method: "POST",
                                query: isMultiple ? undefined : { replace: true },
                                body: form,
                            });
                        } catch (e) {
                            const err = e as FetchError;
                            throw new Error(err?.data?.detail ?? `Erreur lors de l'upload du fichier (${err?.status ?? err?.response?.status ?? "?"})`);
                        }

                        // Upload réussi : on vide les fichiers en attente pour ce champ (et on reflète
                        // leur nom dans formData) afin de ne pas les renvoyer une seconde fois si le
                        // formulaire est resauvegardé plus tard (ex: retour à l'étape 1 puis nouvel envoi),
                        // ce qui créerait des doublons côté Pastell et ferait échouer le comptage à l'étape 2.
                        const names = files.map((f) => f.name);
                        state.formData.value[key] = isMultiple
                            ? [...(Array.isArray(state.formData.value[key]) ? state.formData.value[key] : []), ...names]
                            : names[0];
                        state.pendingFiles.value[key] = [];
                    });

                await Promise.all([patchPromise, ...uploadPromises]);
            }

            // Étape 2 (classification des pièces) : la valeur a été finalisée dans formData
            // juste avant l'appel (cf. finalizeTypePiece), on la patch ici.
            if (opts.phase === "step2-save" || opts.phase === "step2-send") {
                const typePiece = state.formData.value.type_piece;
                if (typePiece) {
                    const rawPieces = Array.isArray(typePiece) ? typePiece : [typePiece];
                    const codes = rawPieces.map((p: string) => p.match(/\(([^)]+)\)$/)?.[1] ?? p);
                    await apiFetch(`/entite/${props.entiteId}/document/${idD}/externalData/type_piece`, {
                        method: "PATCH",
                        body: codes,
                    });
                }
            }

            if (opts.phase === "step2-send" || opts.phase === "single-send") {
                try {
                    await apiFetch(`/entite/${props.entiteId}/documents/perform_action`, {
                        method: "POST",
                        body: { document_ids: idD, action: "orientation" },
                    });
                } catch (e) {
                    const err = e as FetchError;
                    const detail = err?.data?.detail ?? err?.message;
                    throw new Error(`Document enregistré, mais l'envoi a échoué${detail ? ` : ${detail}` : ""}.`);
                }
            }

            // Flux TDT : après l'étape 1, on bascule vers l'étape 2 (classification des pièces)
            // plutôt que de quitter le formulaire. Le endpoint des types de pièces exige que le
            // fichier acte soit déjà présent côté Pastell : on ne peut donc l'appeler qu'une fois
            // les uploads ci-dessus terminés, pas en parallèle.
            if (wantsTypePieceMeta) {
                const metaResult = await state.fetchTypePieceMeta();
                if (!metaResult.ok) throw new Error(metaResult.error);
                state.buildTypePieceItems(metaResult.data);
                return { idD, nextStep: 2 };
            }

            return { idD, nextStep: null };
        },
        onSuccess: ({ idD, nextStep }) => {
            queryClient.invalidateQueries({ queryKey: ["document", props.entiteId, idD] });
            if (nextStep) {
                state.currentStep.value = nextStep;
                return;
            }
            navigateTo(`/org/${props.entiteId}/document/${idD}?type=${props.fluxType ?? ""}`);
        },
        onError: (e: FetchError) => {
            saveError.value = e?.data?.detail ?? e?.message ?? "Erreur lors de la sauvegarde";
        },
    })

    function validateBeforeSave(): boolean {
        saveError.value = null;

        const numeroActeError = validateNumeroActe(state.formData.value.numero_de_lacte);
        if (numeroActeError) {
            saveError.value = `Numéro d'acte : ${numeroActeError}`;
            return false;
        }
        const objetError = validateObjet(state.formData.value.objet);
        if (objetError) {
            saveError.value = `Objet : ${objetError}`;
            return false;
        }

        const allPendingFiles = Object.values(state.pendingFiles.value).flat();
        if (allPendingFiles.length) {
            for (const [key, files] of Object.entries(state.pendingFiles.value)) {
                if (!files.length) continue;
                const def = state.fluxDef.value[key];
                const accept = parseAcceptFromComment(def?.commentaire ?? null);
                const invalid = findInvalidFileName(files, accept);
                if (invalid) {
                    const formats = (accept ?? ".pdf")
                        .split(",")
                        .map((ext) => ext.trim().replace(".", "").toUpperCase())
                        .join(", ");
                    saveError.value = `Le fichier « ${invalid} » n'est pas dans un format accepté pour « ${def?.name ?? key.replace(/_/g, " ")} » (formats acceptés : ${formats}).`;
                    return false;
                }
            }
            const duplicate = findDuplicateFileName(allPendingFiles);
            if (duplicate) {
                saveError.value = `Le fichier « ${duplicate} » est déposé plusieurs fois. Merci de ne pas télétransmettre 2 fois le même document (acte ou annexe), pour éviter les erreurs d'archivage.`;
                return false;
            }
            const totalSize = allPendingFiles.reduce((sum, f) => sum + f.size, 0);
            if (totalSize > MAX_TOTAL_FILES_SIZE_BYTES) {
                saveError.value = `La taille totale des documents (acte + annexes) dépasse 150 Mo (${(totalSize / (1024 * 1024)).toFixed(1)} Mo).`;
                return false;
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
                    return false;
                }
            }
        }
        return true;
    }

    // Fixe la valeur finale de type_piece à partir des sélections de l'étape 2
    function finalizeTypePiece(): boolean {
        saveError.value = null;
        if (state.typePieceItems.value.some((item) => !item.label)) {
            saveError.value = "Veuillez sélectionner tous les types de fichiers requis.";
            return false;
        }
        state.formData.value.type_piece = state.typePieceItems.value.map((item) => item.label);
        return true;
    }

    async function runSave(phase: SavePhase) {
        activePhase.value = phase;
        try {
            await saveDoc({ phase });
        } catch {
            // déjà géré par onError (saveError) ; on avale ici pour éviter une "unhandled rejection"
        } finally {
            activePhase.value = null;
        }
    }

    // Étape 1 (ou formulaire simple si le flux n'a pas d'étape TDT) : "Enregistrer" / "Étape suivante".
    // La transition vers l'étape 2 (si le flux a une étape TDT) est gérée dans la mutation elle-même.
    async function save() {
        // Rien n'a changé depuis le dernier passage à l'étape 2 (ex: Précédent puis Étape
        // suivante sans modification) : on évite le PATCH/upload/rechargement inutiles, ce qui
        // préserve aussi les sélections de classification déjà faites par l'utilisateur.
        if (state.hasStepTdt.value && state.step2Ready.value) {
            state.currentStep.value = 2;
            return;
        }
        if (!validateBeforeSave()) return;
        await runSave("step1");
    }

    // "Enregistrer et envoyer" (flux sans étape TDT) / "Envoyer l'acte" (étape 2)
    async function sendActe() {
        if (state.hasStepTdt.value) {
            if (!finalizeTypePiece()) return;
            await runSave("step2-send");
        } else {
            if (!validateBeforeSave()) return;
            await runSave("single-send");
        }
    }

    // Étape 2 : "Enregistrer" (patch uniquement la classification des pièces)
    async function saveTypePiece() {
        if (!finalizeTypePiece()) return;
        await runSave("step2-save");
    }

    return {
        save,
        sendActe,
        saveTypePiece,
        saving,
        saveError,
        savingStep1: computed(() => saving.value && activePhase.value === "step1"),
        savingTypePiece: computed(() => saving.value && activePhase.value === "step2-save"),
        sending: computed(() => saving.value && (activePhase.value === "step2-send" || activePhase.value === "single-send")),
    };
}
