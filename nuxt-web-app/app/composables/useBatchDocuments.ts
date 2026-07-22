import { ref, computed, watch, type Ref } from "vue";
import { useQueryClient } from "@tanstack/vue-query";
import type { DocumentInfo } from "~/composables/useDocuments";

export function useBatchDocuments(
    entiteId: Ref<number | undefined>,
    documents: Ref<DocumentInfo[]>
) {
    const config = useRuntimeConfig();
    const { user } = useUserContext();
    const queryClient = useQueryClient();

    const selectedIds = ref<Set<string>>(new Set()); // récup les id cochés
    const runningBatchAction = ref<string | null>(null); // quelle action groupée en cours
    const batchResultMessage = ref<{ type: "success" | "error"; text: string } | null>(null);
    const actionLoading = ref<string | null>(null); // pour les actions individuelles

    let batchMessageTimer: ReturnType<typeof setTimeout> | null = null;

    const selected = computed(() => documents.value.filter((doc) => selectedIds.value.has(doc.id_d)));
    const batchableDocs = computed(() => documents.value.filter(canBatchSelect)); // filtre ceux utilisé pour le traitement par lot

    // Nettoie la sélection si l'utilisateur change de page ou si la liste est rechargée
    watch(documents, (currentPageDocs) => {
        const currentIds = new Set(currentPageDocs.map((doc) => doc.id_d));
        selectedIds.value = new Set([...selectedIds.value].filter((id) => currentIds.has(id)));
    });

    const canBatchSelect = (doc: DocumentInfo) => doc.action_possible?.some(isBatchable) ?? false;
    const isSelected = (doc: DocumentInfo) => selectedIds.value.has(doc.id_d);

    // ajoute/retire un id du Set
    function toggleSelect(doc: DocumentInfo, checked: boolean) {
        const next = new Set(selectedIds.value);
        checked ? next.add(doc.id_d) : next.delete(doc.id_d);
        selectedIds.value = next;
    }

    function toggleSelectAll(checked: boolean) {
        selectedIds.value = checked ? new Set(batchableDocs.value.map((d) => d.id_d)) : new Set();
    }

    const allSelected = computed(
        () => batchableDocs.value.length > 0 && selectedIds.value.size === batchableDocs.value.length
    );
    const someSelected = computed(() => selectedIds.value.size > 0 && !allSelected.value);

    // Calcul d'intersection
    const availableActions = computed(() => {
        const docs = selected.value;
        if (!docs.length) return [];

        const [firstDoc, ...otherDocs] = docs.map((doc) =>
            (doc.action_possible ?? []).filter(isBatchable)
        );
        if (!firstDoc) return [];

        return firstDoc
            .filter((act) => otherDocs.every((other) => other.some((o) => o.action === act.action)))
            .map((act) => ({ value: act.action, label: act.message ?? act.action }));
    });

    function showBatchResult(type: "success" | "error", text: string) {
        batchResultMessage.value = { type, text };
        if (batchMessageTimer) clearTimeout(batchMessageTimer);
        batchMessageTimer = setTimeout(() => (batchResultMessage.value = null), 5000);
    }

    async function performAction(targetEntiteId: number | string, documentIds: string | string[], action: string) {
        await $fetch(`/entite/${targetEntiteId}/documents/perform_action`, {
            method: "POST",
            baseURL: config.public.apiBaseUrl,
            headers: { Authorization: `Bearer ${user.value?.token}` },
            body: { document_ids: documentIds, action },
        });
        queryClient.invalidateQueries({ queryKey: ["documents", Number(targetEntiteId)] });
    }

    // action groupée(s)
    async function executeBatchAction(action: string) {
        const ids = [...selectedIds.value];
        if (!ids.length || !entiteId.value) return;

        if (action === "supression" && !confirm(`Confirmer la suppression de ${ids.length} document${ids.length > 1 ? "s" : ""} ?`)) {
            return;
        }
        runningBatchAction.value = action;
        try {
            await performAction(entiteId.value, ids, action);
            showBatchResult("success", `${ids.length} document${ids.length > 1 ? "s" : ""} traité${ids.length > 1 ? "s" : ""} avec succès.`);
            selectedIds.value = new Set();
        } catch (e: any) {
            showBatchResult("error", e?.data?.detail ?? "Le lot n'a pas pu être traité entièrement.");
        } finally {
            runningBatchAction.value = null;
        }
    }

    async function handleSingleAction(doc: DocumentInfo, action: string, confirmMessage?: string) {
        if (confirmMessage && !confirm(confirmMessage)) return;
        actionLoading.value = `${action}_${doc.id_d}`;
        try {
            await performAction(doc.id_e, doc.id_d, action);
        } finally {
            actionLoading.value = null;
        }
    }

    return {
        selected,
        runningBatchAction,
        batchResultMessage,
        batchableDocs,
        allSelected,
        someSelected,
        availableActions,
        actionLoading,
        canBatchSelect,
        isSelected,
        toggleSelect,
        toggleSelectAll,
        executeBatchAction,
        closeBatchResult: () => {
            if (batchMessageTimer) clearTimeout(batchMessageTimer);
            batchResultMessage.value = null;
        },
        duplicateDoc: (doc: DocumentInfo) => handleSingleAction(doc, "duplicate"),
        deleteDoc: (doc: DocumentInfo) => handleSingleAction(doc, "supression", `Supprimer « ${doc.titre || "ce document"} » ?`),
    };
}