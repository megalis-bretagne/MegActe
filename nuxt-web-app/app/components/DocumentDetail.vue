<script setup lang="ts">
import { useQuery, useQueryClient } from "@tanstack/vue-query";

const props = defineProps<{ idD: string; fluxType?: string }>();

const router = useRouter();
const { data: user } = useAuth();
const { getFluxDef, fluxDefFor } = useFluxDef();
const entiteId = useSelectedEntiteId();
const apiFetch = useApiFetch();
const queryClient = useQueryClient();

// skip_external_data : les pièces jointes sont lentes côté Pastell, chargées séparément via
// fetchExternalData pour ne pas bloquer l'affichage du reste du document. Sert aussi au
// polling post-action (seuls last_action/action_possible nous intéressent alors).
async function fetchDocument() {
  const query = {
    ...(props.fluxType ? { type_flux: props.fluxType } : {}),
    skip_external_data: true,
  };
  return await apiFetch<DocumentDetail>(
    `/entite/${entiteId.value}/document/${props.idD}`,
    { query }
  );
}

function fetchJournal() {
  return apiFetch<JournalListEntry[]>(
    `/entite/${entiteId.value}/document/${props.idD}/journal`
  );
}

// Limité aux clés présentes dans doc.data, sinon 404 Pastell sur les clés que ce flux ne
// définit pas. ged_document_id_file en plus : sa clé existe même sans retour GED, d'où le
// check has_ged_document_id (même condition que l'onglet "Retour GED" dans flux-tabs.ts).
function fetchExternalData() {
  const data = doc.value?.data ?? {};
  const keys = Object.keys(data).filter(
    (key) => key !== "ged_document_id_file" || data.has_ged_document_id === "1"
  );
  return apiFetch<Record<string, unknown>>(
    `/entite/${entiteId.value}/document/${props.idD}/external-data`,
    {
      query: { keys },
    }
  );
}

const docQueryKey = computed(() => ["document", entiteId.value, props.idD]);
const journalQueryKey = computed(() => ["journal", entiteId.value, props.idD]);
const externalDataQueryKey = computed(() => [
  "document-external-data",
  entiteId.value,
  props.idD,
]);
const isReady = computed(() => !!user.value?.accessToken && !!entiteId.value);

// Préfetch bloquant en SSR : sans l'await, useQuery ne fait que démarrer le fetch sans
// l'attendre et l'état "en cours de chargement" est déshydraté tel quel (lenteur perçue
// malgré ssr: true). Capté par le <Suspense> racine. externalData est volontairement exclue
// ici : c'est la partie la plus lente, elle se charge après coup sans bloquer le rendu.
if (import.meta.server && isReady.value) {
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: docQueryKey.value,
      queryFn: fetchDocument,
      staleTime: 30_000,
    }),
    // Même staleTime que doc (30s) : le journal doit rester en phase avec action_possible.
    queryClient.prefetchQuery({
      queryKey: journalQueryKey.value,
      queryFn: fetchJournal,
      staleTime: 30_000,
    }),
  ]);
  // FluxDetails (fluxDef) : dépend du type de flux, connu tout de suite via la query "type"
  // (portée par le lien depuis la liste) sinon seulement une fois le document préfetché ci-dessus.
  const cachedDoc = queryClient.getQueryData<DocumentDetail>(docQueryKey.value);
  const effectiveType = props.fluxType ?? cachedDoc?.info?.type;
  if (effectiveType) await getFluxDef(effectiveType);
}

const {
  data: doc,
  isPending,
  error,
} = useQuery({
  queryKey: docQueryKey,
  queryFn: fetchDocument,
  enabled: isReady,
  staleTime: 30_000,
  placeholderData: (prev) => prev,
  retry: shouldRetry,
});

useHead({ title: () => doc.value?.info?.titre || "Document" });

const { data: journalData, isPending: journalPending } = useQuery({
  queryKey: journalQueryKey,
  queryFn: fetchJournal,
  enabled: isReady,
  staleTime: 30_000,
  retry: shouldRetry,
});

// Dépend de doc (pour connaître ses clés, cf. fetchExternalData) : se déclenche juste après lui.
const { data: externalData } = useQuery({
  queryKey: externalDataQueryKey,
  queryFn: fetchExternalData,
  enabled: computed(() => isReady.value && !!doc.value?.data),
  staleTime: 30_000,
  retry: shouldRetry,
});

// À utiliser à la place de doc.value?.data partout où un champ external_data peut être affiché.
const mergedData = computed(() => ({
  ...doc.value?.data,
  ...externalData.value,
}));

// Type de flux effectif : la prop (dispo dès le mount) sinon celui du document une fois chargé.
const effectiveFluxType = computed(
  () => props.fluxType ?? doc.value?.info?.type
);

const fluxDef = computed(() => {
  const type = effectiveFluxType.value;
  if (!type) return {};
  return fluxDefFor(type) ?? {};
});

watch(
  () => ({
    token: user.value?.accessToken,
    type: effectiveFluxType.value,
  }),
  async ({ token, type }) => {
    if (token && type) await getFluxDef(type);
  },
  { immediate: true }
);

const tabs = computed(() => {
  const fluxType = effectiveFluxType.value;
  const config = FLUX_TABS_CONFIG[fluxType];
  if (!config) return [{ id: "preparer", label: "Préparer", fields: [] }];
  const filtered = config.filter(
    (tab) => !tab.condition || tab.condition(mergedData.value)
  );

  // Comme dans le formulaire de création : "Acte" est fusionné dans "Préparer" pour
  // alléger l'affichage (moins d'onglets à parcourir pour un même acte).
  const acteTab = filtered.find((t) => t.id === "acte");
  if (!acteTab) return filtered;
  return filtered
    .filter((t) => t.id !== "acte")
    .map((t) =>
      t.id === "preparer"
        ? {
            ...t,
            fields: [...t.fields, ...acteTab.fields],
            alwaysShow: [
              ...(t.alwaysShow ?? []),
              ...(acteTab.alwaysShow ?? []),
            ],
          }
        : t
    );
});

const activeTab = ref("preparer");

const activeTabFields = computed(() => {
  if (!doc.value?.data) return [];

  const tab = tabs.value.find((t) => t.id === activeTab.value);
  if (!tab) return [];

  const fluxType = effectiveFluxType.value;
  if (!FLUX_TABS_CONFIG[fluxType] && tab.id === "preparer") {
    return getFilteredFields();
  }

  const alwaysShow = new Set(tab.alwaysShow ?? []);
  return tab.fields
    .map((key) => {
      const def = fluxDef.value[key];
      const val = mergedData.value[key];
      const isEmpty =
        val === undefined ||
        val === null ||
        val === "" ||
        val === "[]" ||
        (Array.isArray(val) && val.length === 0);
      if (isEmpty && !alwaysShow.has(key)) return null;
      return {
        key,
        val: isEmpty ? null : val,
        label: def?.name ?? key.replace(/_/g, " "),
        type: def?.type ?? "text",
        selectValues: def?.value ?? null,
        commentaire: def?.commentaire ?? null,
      };
    })
    .filter(Boolean);
});

// filterFields pour flux sans config
function getFilteredFields() {
  return Object.entries(fluxDef.value)
    .filter(([, def]) => {
      if (def?.["no-show"]) return false;
      if (!def?.type) return false;
      if (def?.requis) {
        if (def.type === "file" && def["readonly"]) return false;
        return true;
      }
      if (def?.["readonly"] === true) return false;
      if ((def?.type === "date" || def?.type === "file") && !def?.commentaire)
        return false;
      return true;
    })
    .filter(([key]) => key !== "type_piece")
    .map(([key, def]) => ({
      key,
      val: mergedData.value[key] ?? null,
      label: def?.name ?? key.replace(/_/g, " "),
      type: def?.type ?? "text",
      selectValues: def?.value ?? null,
      commentaire: def?.commentaire ?? null,
    }))
    .filter(
      ({ val }) =>
        val !== null &&
        val !== "" &&
        val !== "[]" &&
        !(Array.isArray(val) && val.length === 0)
    );
}

const { actionLoading, actionError, runAction } = useDocumentActions(
  entiteId,
  toRef(props, "idD"),
  effectiveFluxType,
  doc,
  fetchDocument
);

const journalEntries = computed(() => journalData.value ?? []);

const journalUser = (entry: JournalListEntry) => {
  const name = [entry.prenom, entry.nom].filter(Boolean).join(" ");
  return name || "Action automatique";
};

const ACTION_SEVERITY: Record<string, string> = {
  modification: "secondary",
  supression: "danger",
};
const actionSeverity = (action: string) => ACTION_SEVERITY[action] ?? "primary";
</script>

<template>
  <div class="max-w-8xl mx-auto px-4 py-6">
    <button
      class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      @click="router.push('/documents')"
    >
      <i class="pi pi-arrow-left text-xs" />
      Retour à la liste
    </button>

    <div v-if="error" class="text-red-600 py-4">
      Erreur lors du chargement du document.
    </div>

    <div v-else-if="isPending" class="space-y-4">
      <Skeleton width="66%" height="2rem" />
      <Skeleton width="25%" height="1rem" />
      <div class="flex gap-4 mt-2">
        <Skeleton width="8rem" height="0.75rem" />
        <Skeleton width="8rem" height="0.75rem" />
      </div>
      <div class="flex gap-2 mt-4">
        <Skeleton width="6rem" height="2.25rem" border-radius="6px" />
        <Skeleton width="6rem" height="2.25rem" border-radius="6px" />
      </div>
      <div class="border border-gray-200 rounded-lg overflow-hidden mt-6">
        <div v-for="i in 5" :key="i" class="flex px-4 py-3 even:bg-gray-50">
          <Skeleton width="33%" height="0.75rem" />
          <Skeleton width="50%" height="0.75rem" class="ml-8" />
        </div>
      </div>
    </div>

    <template v-else-if="doc">
      <div class="mb-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              {{ doc.info.titre || "Sans titre" }}
            </h1>
            <p class="text-sm text-gray-500 mt-1">{{ doc.info.type }}</p>
          </div>
        </div>
      </div>

      <div
        v-if="actionError"
        class="mb-4 text-sm text-red-700 bg-red-50 px-4 py-3 rounded border border-red-300 w-full"
      >
        {{ actionError }}
      </div>

      <div class="border-b border-gray-200 mb-0">
        <nav class="flex gap-0">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="
              activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
            "
            class="px-6 py-3 text-sm transition-colors -mb-px"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <div
        class="rounded-b-lg rounded-tr-lg border border-t-0 border-gray-200 overflow-hidden"
      >
        <!-- Skeleton flux pas encore chargé -->
        <div
          v-if="
            !Object.keys(fluxDef).length ||
            (isPending && !Object.keys(doc?.data ?? {}).length)
          "
          class="divide-y divide-gray-100"
        >
          <div v-for="i in 5" :key="i" class="flex px-4 py-3 even:bg-gray-50">
            <Skeleton width="33%" height="0.75rem" />
            <Skeleton width="50%" height="0.75rem" class="ml-8" />
          </div>
        </div>

        <template v-else>
          <div
            v-if="activeTabFields.length === 0"
            class="px-4 py-6 text-center text-gray-400 italic"
          >
            Aucun champ disponible
          </div>
          <dl
            v-else
            class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 p-4"
          >
            <div v-for="field in activeTabFields" :key="field.key">
              <dt
                class="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1"
              >
                {{ field.label }}
              </dt>
              <dd class="text-sm text-gray-800">
                <DocumentFieldViewer
                  :field="field"
                  :entite-id="entiteId"
                  :id-d="props.idD"
                  :doc-data="doc?.data"
                />
              </dd>
            </div>
          </dl>
        </template>
      </div>

      <!-- Actions : skeleton tant que le fetch frais n'est pas terminé -->
      <div class="flex flex-wrap gap-2 mt-4">
        <template v-if="!doc?.info?.creation">
          <Skeleton width="6rem" height="2.25rem" border-radius="6px" />
          <Skeleton width="6rem" height="2.25rem" border-radius="6px" />
          <Skeleton width="9rem" height="2.25rem" border-radius="6px" />
        </template>
        <template v-else-if="doc.action_possible?.length">
          <Button
            v-for="action in doc.action_possible.filter(
              (a: ActionPossible) =>
                a.message &&
                !(a.action === 'modification' && doc.last_action === 'termine')
            )"
            :key="action.action"
            :label="action.message"
            :icon="
              actionLoading === action.action
                ? 'pi pi-spinner pi-spin'
                : batchActionIcon(action.action)
            "
            :severity="actionSeverity(action.action)"
            :disabled="!!actionLoading"
            size="small"
            @click="runAction(action)"
          />
        </template>
      </div>

      <div class="mt-6 border border-gray-200 rounded-lg overflow-hidden">
        <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 class="text-sm font-semibold text-gray-700">États du dossier</h2>
        </div>
        <div v-if="journalPending" class="p-4 space-y-5">
          <div v-for="i in 3" :key="i" class="flex gap-3">
            <Skeleton shape="circle" size="0.75rem" class="mt-1" />
            <div class="flex-1 space-y-2">
              <Skeleton width="40%" height="0.75rem" />
              <Skeleton width="25%" height="0.75rem" />
            </div>
          </div>
        </div>
        <div
          v-else-if="!journalEntries.length"
          class="px-4 py-6 text-center text-gray-400 italic text-sm"
        >
          Aucun événement enregistré
        </div>
        <Timeline
          v-else
          :value="journalEntries"
          class="p-3"
          style="--p-timeline-event-min-height: 0"
        >
          <template #marker>
            <span class="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          </template>
          <template #content="{ item }">
            <div class="pb-2.5 flex items-baseline gap-2">
              <p class="text-sm text-gray-800">
                {{ item.action_libelle || item.action || "—" }}
              </p>
              <p class="text-xs text-gray-400 tabular-nums whitespace-nowrap">
                {{ formatDate(item.date) }} · {{ journalUser(item) }}
              </p>
            </div>
          </template>
        </Timeline>
      </div>
    </template>
  </div>
</template>
