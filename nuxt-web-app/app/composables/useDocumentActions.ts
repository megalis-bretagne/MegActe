import { ref, type Ref } from "vue";

// Alignées avec DocumentConfig.external_data_to_retrieve (back) : non retéléchargées par
// fetchDocumentStatus, on garde donc leur version déjà enrichie plutôt que de les écraser.
const EXTERNAL_DATA_KEYS = ["type_piece_fichier", "ged_document_id_file"];

export function useDocumentActions(
  entiteId: Ref<number>,
  idD: Ref<string>,
  effectiveFluxType: Ref<string | undefined>,
  doc: Ref<DocumentDetail>,
  fetchDocumentStatus: () => Promise<DocumentDetail>
) {
  const queryClient = useQueryClient();
  const apiFetch = useApiFetch();

  const actionLoading = ref<string | null>(null);
  const actionError = ref<string | null>(null);

  async function syncActionStatus() {
    const [updated] = await Promise.all([
      fetchDocumentStatus(),
      queryClient.invalidateQueries({
        queryKey: ["journal", entiteId.value, idD.value],
      }),
    ]);
    queryClient.setQueryData<DocumentDetail>(
      ["document", entiteId.value, idD.value],
      (old) => {
        if (!old) return updated;
        const data = { ...old.data, ...updated?.data };
        for (const key of EXTERNAL_DATA_KEYS) {
          if (key in old.data) data[key] = old.data[key];
        }
        return {
          ...old,
          last_action: updated?.last_action,
          action_possible: updated?.action_possible,
          last_action_message: updated?.last_action_message,
          data,
        };
      }
    );
    return updated;
  }

  async function waitForActionSync(
    previousState: string | undefined
  ): Promise<boolean> {
    let changed = false;
    let lastKnownState = previousState;
    const startedAt = Date.now();
    let attempt = 0;
    while (Date.now() - startedAt < ACTION_POLL_MAX_DURATION_MS) {
      const delay =
        ACTION_POLL_DELAYS_MS[attempt] ?? ACTION_POLL_FALLBACK_INTERVAL_MS;
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt++;
      let updated: DocumentDetail | undefined;
      try {
        updated = await syncActionStatus();
      } catch {
        // Erreur ponctuelle (ex: 500 backend transitoire) : on retente au prochain délai
        // plutôt que d'abandonner tout le suivi pour un seul aléa réseau.
        continue;
      }
      if (updated?.last_action !== lastKnownState) {
        // Encore en train de bouger : on continue à poller, quel que soit le nombre
        // d'étapes déjà enchaînées .
        changed = true;
        lastKnownState = updated?.last_action;
        continue;
      }
      if (changed) break; // stable normalement
    }
    return changed;
  }

  const { mutateAsync: performAction } = useMutation({
    mutationFn: ({
      action: actionName,
      targetEntiteId,
      targetIdD,
    }: {
      action: string;
      previousState: string | undefined;
      targetEntiteId: number;
      targetIdD: string;
    }) =>
      apiFetch<ActionResult>(
        `/entite/${targetEntiteId}/documents/perform_action`,
        {
          method: "POST",
          body: { document_ids: targetIdD, action: actionName },
        }
      ),

    onSuccess: (
      result,
      { action: actionName, previousState, targetEntiteId, targetIdD }
    ) => {
      if (actionName === "supression") {
        // Le document n'existe plus : retour à la liste (et non au tableau de bord `/`).
        navigateTo("/documents");
        return;
      }

      if (actionName === "teletransmission-tdt") {
        if (result?.data?.url) {
          window.location.href = buildTdtReturnUrl(
            result.data.url,
            targetEntiteId,
            targetIdD
          );
          return;
        }
        // Pas d'URL de redirection S2low (flux ne nécessitant pas de signature externe) :
        // resynchronise l'affichage comme pour les autres actions.
        waitForActionSync(previousState).catch(() => {});
        return;
      }

      if (actionName === "duplicate") {
        return;
      }

      waitForActionSync(previousState).catch(() => {});
    },
  });

  async function runAction(action: { action: string; message: string }) {
    if (action.action === "modification") {
      navigateTo(
        `/org/${entiteId.value}/document/${idD.value}/edit?type=${effectiveFluxType.value ?? ""}`
      );
      return;
    }

    actionLoading.value = action.action;
    actionError.value = null;
    const previousState = doc.value?.last_action;
    const targetEntiteId = entiteId.value;
    const targetIdD = idD.value;
    try {
      await performAction({
        action: action.action,
        previousState,
        targetEntiteId,
        targetIdD,
      });
    } catch (e: unknown) {
      actionError.value = getErrorDetail(e, "Une erreur est survenue");
      // Cas fréquent : action_possible périmé en cache. Resynchronise tout de suite plutôt que
      // forcer un rechargement manuel pour voir les bons boutons.
      syncActionStatus().catch(() => {});
    } finally {
      actionLoading.value = null;
    }
  }

  return {
    actionLoading,
    actionError,
    runAction,
  };
}
