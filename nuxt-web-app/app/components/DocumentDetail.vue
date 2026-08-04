<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { FetchError } from "ofetch";

const props = defineProps<{ idD: string; fluxType?: string }>();

const config = useRuntimeConfig();
const router = useRouter();
const { data: user } = useAuth();
const { getFluxDef, fluxDefFor } = useFluxDef();
const entiteId = useSelectedEntiteId();

// ── Fetch document ────────────────────────────────────────────────────────────
async function fetchDocument() {
  const url = `/entite/${entiteId.value}/document/${props.idD}`;
  const query = props.fluxType ? { type_flux: props.fluxType } : undefined;
  try {
    return await $fetch<DocumentDetail>(url, {
      baseURL: config.public.apiBaseUrl,
      headers: { Authorization: `Bearer ${user.value?.accessToken}` },
      query,
    });
  } catch (e) {
    if (e instanceof FetchError) {
      if (e?.status === 403) {
        const newToken = await tryRefreshToken();
        if (newToken) {
          return await $fetch<DocumentDetail>(url, {
            baseURL: config.public.apiBaseUrl,
            headers: { Authorization: `Bearer ${newToken}` },
            query,
          });
        }
      }
    }
    throw e;
  }
}

// Pas de retry sur 4xx (erreur définitive, pas transitoire)
function retryUnlessClientError(failureCount: number, error: unknown): boolean {
  if (error instanceof FetchError) {
    const status = error?.status ?? error?.response?.status;
    if (status && status >= 400 && status < 500) return false;
    return failureCount < 1;
  }
  return false;
}

const {
  data: doc,
  isPending,
  error,
} = useQuery({
  queryKey: computed(() => ["document", entiteId.value, props.idD]),
  queryFn: fetchDocument,
  enabled: computed(() => !!user.value?.accessToken),
  staleTime: 30_000,
  placeholderData: (prev) => prev,
  retry: retryUnlessClientError,
});

// ── Fetch journal ─────────────────────────────────────────────────────────────
const { data: journalData, isPending: journalPending } = useQuery({
  queryKey: computed(() => ["journal", entiteId.value, props.idD]),
  queryFn: async () => {
    const url = `/entite/${entiteId.value}/document/${props.idD}/journal`;
    try {
      return await $fetch<Journal>(url, {
        baseURL: config.public.apiBaseUrl,
        headers: { Authorization: `Bearer ${user.value?.accessToken}` },
      });
    } catch (e) {
      if (e instanceof FetchError) {
        if (e?.status === 403) {
          const newToken = await tryRefreshToken();
          if (newToken) {
            return await $fetch<Journal>(url, {
              baseURL: config.public.apiBaseUrl,
              headers: { Authorization: `Bearer ${newToken}` },
            });
          }
        }
      }
      throw e;
    }
  },
  enabled: computed(() => !!user.value?.accessToken),
  staleTime: 5 * 60 * 1000,
  retry: retryUnlessClientError,
});

// Type de flux effectif : celui passé en prop (dispo dès le mount, ex: venant
// d'edit.vue) sinon celui du document une fois chargé. Mutualisé ici pour ne
// plus le recalculer séparément dans fluxDef / watch / tabs / activeTabFields / runAction.
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

// ── Définition des onglets par flux ──────────────────────────────────────────

// Onglets disponibles selon le type de flux (filtrés par condition)
const tabs = computed(() => {
  const fluxType = effectiveFluxType.value;
  const config = FLUX_TABS_CONFIG[fluxType];
  if (!config) return [{ id: "preparer", label: "Préparer", fields: [] }];
  const data = doc.value?.data ?? {};
  return config.filter((tab) => !tab.condition || tab.condition(data));
});

const activeTab = ref("preparer");

// ── Champs de l'onglet actif ──────────────────────────────────────────────────
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
      const val = doc.value.data[key];
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
        if (def.type === "file" && def["read-only"]) return false;
        return true;
      }
      if (def?.["read-only"] === true) return false;
      if ((def?.type === "date" || def?.type === "file") && !def?.commentaire)
        return false;
      return true;
    })
    .filter(([key]) => key !== "type_piece")
    .map(([key, def]) => ({
      key,
      val: doc.value.data[key] ?? null,
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

// ── Helpers d'affichage des actions ──────────────────────────────────────────

const ACTION_SEVERITY: Record<string, string> = {
  modification: "secondary",
  supression: "danger",
};
const actionSeverity = (action: string) => ACTION_SEVERITY[action] ?? "primary";
</script>

<template>
  <div class="max-w-8xl mx-auto px-4 py-6">
    <!-- Retour -->
    <button
      class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      @click="router.back()"
    >
      <i class="pi pi-arrow-left text-xs" />
      Retour à la liste
    </button>

    <div v-if="error" class="text-red-600 py-4">
      Erreur lors du chargement du document.
    </div>

    <!-- Skeleton chargement -->
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
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              {{ doc.info.titre || "Sans titre" }}
            </h1>
            <p class="text-sm text-gray-500 mt-1">{{ doc.info.type }}</p>
          </div>
        </div>
        <!-- Date de création : skeleton tant que le fetch frais n'est pas terminé -->
        <div v-if="!doc?.info?.creation" class="flex gap-4 mt-3">
          <Skeleton width="8rem" height="0.75rem" />
        </div>
        <div v-else class="flex gap-6 mt-3 text-xs text-gray-400">
          <span>Créé le {{ formatDate(doc.info.creation) }}</span>
        </div>
      </div>

      <!-- Actions : skeleton tant que le fetch frais n'est pas terminé -->
      <div class="flex flex-wrap gap-2 mb-6">
        <template v-if="!doc?.info?.creation">
          <Skeleton width="6rem" height="2.25rem" border-radius="6px" />
          <Skeleton width="6rem" height="2.25rem" border-radius="6px" />
          <Skeleton width="9rem" height="2.25rem" border-radius="6px" />
        </template>
        <template v-else-if="doc.action_possible?.length">
          <Button
            v-for="action in doc.action_possible.filter(
              (a: any) =>
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
            @click="runAction(action)"
          />
        </template>
      </div>

      <!-- Bannière erreur formulaire : only si la partie avant ' : ' est un code action (sans espace) -->
      <div
        v-if="
          doc?.last_action_message && /^[^\s]+ : /.test(doc.last_action_message)
        "
        class="mb-4 text-sm text-red-700 bg-red-50 px-4 py-3 rounded border border-red-300 w-full"
      >
        {{ doc.last_action_message }}
      </div>

      <div
        v-if="actionError"
        class="mb-4 text-sm text-red-700 bg-red-50 px-4 py-3 rounded border border-red-300 w-full"
      >
        {{ actionError }}
      </div>

      <!-- Onglets -->
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

      <!-- Contenu onglet actif -->
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
          <table class="min-w-full text-sm">
            <tbody class="divide-y divide-gray-100">
              <tr v-if="activeTabFields.length === 0">
                <td
                  colspan="2"
                  class="px-4 py-6 text-center text-gray-400 italic"
                >
                  Aucun champ disponible
                </td>
              </tr>
              <tr
                v-for="field in activeTabFields"
                :key="field.key"
                class="even:bg-gray-50"
              >
                <td
                  class="px-4 py-3 font-medium text-gray-600 w-1/3 align-top whitespace-nowrap"
                >
                  {{ field.label }}
                </td>
                <td class="px-4 py-3 text-gray-800">
                  <DocumentFieldViewer
                    :field="field"
                    :entite-id="entiteId"
                    :id-d="props.idD"
                    :doc-data="doc?.data"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </div>

      <!-- États du dossier -->
      <div class="mt-6 border border-gray-200 rounded-lg overflow-hidden">
        <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 class="text-sm font-semibold text-gray-700">États du dossier</h2>
        </div>
        <div v-if="journalPending" class="divide-y divide-gray-100">
          <div v-for="i in 3" :key="i" class="flex gap-4 px-4 py-3">
            <Skeleton width="25%" height="0.75rem" />
            <Skeleton width="25%" height="0.75rem" />
            <Skeleton width="20%" height="0.75rem" />
          </div>
        </div>
        <div
          v-else-if="!journalEntries.length"
          class="px-4 py-6 text-center text-gray-400 italic text-sm"
        >
          Aucun événement enregistré
        </div>
        <table v-else class="min-w-full text-sm">
          <thead class="bg-white border-b border-gray-100">
            <tr>
              <th class="px-4 py-2 text-left font-medium text-gray-600">
                État
              </th>
              <th class="px-4 py-2 text-left font-medium text-gray-600">
                Date
              </th>
              <th class="px-4 py-2 text-left font-medium text-gray-600">
                Utilisateur
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="entry in journalEntries"
              :key="entry.id_j"
              class="even:bg-gray-50"
            >
              <td class="px-4 py-2 text-gray-800 whitespace-nowrap">
                {{ entry.action_libelle || entry.action || "—" }}
              </td>
              <td
                class="px-4 py-2 text-gray-600 tabular-nums whitespace-nowrap"
              >
                {{ formatDate(entry.date) }}
              </td>
              <td class="px-4 py-2 text-gray-600 whitespace-nowrap">
                {{ journalUser(entry) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
