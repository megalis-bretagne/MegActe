import { ref, type Ref } from "vue";

const ACTION_POLL_DELAYS_MS = [300, 600, 1000, 1500, 2000, 3000];
const ACTION_POLL_FALLBACK_INTERVAL_MS = 3000;
const ACTION_POLL_MAX_DURATION_MS = 30_000;

// Doit rester aligné avec DocumentConfig.external_data_to_retrieve (config/configuration.py) :
// ces clés ne sont pas retéléchargées par fetchDocumentStatus (skip_external_data), donc on
// garde leur version déjà enrichie du cache au lieu de les écraser avec la valeur brute Pastell.
const EXTERNAL_DATA_KEYS = ["type_piece_fichier", "ged_document_id_file"];

export function useDocumentActions(
    entiteId: Ref<number>,
    idD: Ref<string>,
    effectiveFluxType: Ref<string | undefined>,
    doc: Ref<DocumentDetail>,
    fetchDocumentStatus: () => Promise<DocumentDetail>,
) {
  const queryClient = useQueryClient();
  const apiFetch = useApiFetch();

  const actionLoading = ref<string | null>(null);
  const actionError = ref<string | null>(null);

  // utilisée pour synchroniser les actions possibles.
  async function syncActionStatus() {
    const [updated] = await Promise.all([
      fetchDocumentStatus(),
      queryClient.invalidateQueries({
        queryKey: ["journal", entiteId.value, idD.value],
      }),
    ]);
    queryClient.setQueryData<DocumentDetail>(["document", entiteId.value, idD.value], (old) => {
      if (!old) return updated;
      const data = { ...old.data, ...updated?.data };
      for (const key of EXTERNAL_DATA_KEYS) {
        if (key in old.data) data[key] = old.data[key];
      }
      console.log("old = ",old)
      return {
        ...old,
        last_action: updated?.last_action,
        action_possible: updated?.action_possible,
        last_action_message: updated?.last_action_message,
        data,
      };
    });
    console.log("updated", updated);
    return updated;
  }

  async function waitForActionSync(previousState: string | undefined): Promise<boolean> {
    let changed = false;
    let lastKnownState = previousState;
    const startedAt = Date.now();
    let attempt = 0;
    while (Date.now() - startedAt < ACTION_POLL_MAX_DURATION_MS) {
      const delay = ACTION_POLL_DELAYS_MS[attempt] ?? ACTION_POLL_FALLBACK_INTERVAL_MS;
      await new Promise((resolve) => setTimeout(resolve, delay));
      const updated = await syncActionStatus();
      attempt++;
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
    mutationFn: ({ action: actionName }: { action: string; previousState: string | undefined }) =>
      apiFetch<{ result: boolean; message?: string; data?: { url?: string } }>(
        `/entite/${entiteId.value}/documents/perform_action`,
        {
          method: "POST",
          body: { document_ids: idD.value, action: actionName },
        }
      ),
    onSuccess: (result, { action: actionName, previousState }) => {
      if (actionName === "supression") {
        navigateTo(`/`);
        return;
      }

      if (actionName === "teletransmission-tdt") {
        if (result?.data?.url) {
          window.location.href = buildTdtReturnUrl(result.data.url, entiteId.value, idD.value);
        }
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
          `/org/${entiteId.value}/document/${idD.value}/edit?type=${effectiveFluxType.value ?? ""}`,
      );
      return;
    }

    actionLoading.value = action.action;
    actionError.value = null;
    const previousState = doc.value?.last_action;
    try {
      await performAction({ action: action.action, previousState });
    } catch (e: unknown) {
      actionError.value = getErrorDetail(e, "Une erreur est survenue");
      // Cas fréquent : l'action affichée n'était déjà plus valide côté Pastell (action_possible
      // périmé dans le cache). On resynchronise tout de suite au lieu de forcer un rechargement
      // manuel de la page pour voir les bons boutons.
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
