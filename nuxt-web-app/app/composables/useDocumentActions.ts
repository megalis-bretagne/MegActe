import { ref, type Ref } from "vue";
import { useMutation, useQueryClient } from "@tanstack/vue-query";

// Poll jusqu'à ce que last_action se stabilise (Pastell peut enchaîner plusieurs transitions)
const ACTION_POLL_DELAYS_MS = [300, 600, 1000, 1500, 2000, 3000];

export function useDocumentActions(
    entiteId: Ref<number>,
    idD: Ref<string>,
    effectiveFluxType: Ref<string | undefined>,
    doc: Ref<any>,
    fetchDocument: () => Promise<any>,
) {
  const config = useRuntimeConfig();
  const { user } = useUserContext();
  const queryClient = useQueryClient();

  const actionLoading = ref<string | null>(null);
  const actionError = ref<string | null>(null);

  async function waitForActionSync(previousState: string | undefined): Promise<boolean> {
    let changed = false;
    let lastSeen = previousState;
    for (const delay of ACTION_POLL_DELAYS_MS) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      const updated = await queryClient.fetchQuery({
        queryKey: ["document", entiteId.value, idD.value],
        queryFn: fetchDocument,
      });
      if (updated?.last_action !== lastSeen) {
        // Encore en train de bouger : on continue à poller
        changed = true;
        lastSeen = updated?.last_action;
        continue;
      }
      if (changed) break; // stable depuis un cycle
    }
    await queryClient.invalidateQueries({
      queryKey: ["journal", entiteId.value, idD.value],
    });
    return changed;
  }

  const { mutateAsync: performAction } = useMutation({
    mutationFn: async ({ action: actionName }: { action: string; previousState: string | undefined }) => {
      const doFetch = (token: string) =>
          $fetch(`/entite/${entiteId.value}/documents/perform_action`, {
            method: "POST",
            baseURL: config.public.apiBaseUrl,
            headers: { Authorization: `Bearer ${token}` },
            body: { document_ids: idD.value, action: actionName },
          });
      try {
        await doFetch(user.value?.token);
      } catch (e: any) {
        if (e?.status !== 403) throw e;
        const newToken = await tryRefreshToken();
        if (!newToken) throw e;
        await doFetch(newToken);
      }
    },
    onSuccess: async (_, { action: actionName, previousState }) => {
      if (actionName === "supression") {
        navigateTo(`/`);
        return;
      }
      // On attend que le document et le journal soient rechargés avant de laisser
      // runAction lever actionLoading : sinon les boutons redeviennent cliquables
      // avec l'ancien action_possible pendant que Pastell recalcule les actions
      // disponibles, ce qui provoque un affichage de boutons/journal obsolètes.
      await waitForActionSync(previousState);
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
    } catch (e: any) {
      actionError.value = e?.data?.detail ?? e?.message ?? "Une erreur est survenue";
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
