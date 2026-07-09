<script setup lang="ts">
import { ITEMS_PER_PAGE } from "~/composables/useDocuments";
import { useQueryClient } from "@tanstack/vue-query";

const props = defineProps<{
  entiteId: number | undefined;
}>();

const config = useRuntimeConfig();
const router = useRouter();
const route = useRoute();
const { user, selectedFlux } = useUserContext();
const queryClient = useQueryClient();

function createDoc() {
  if (!selectedFlux.value) return;
  router.push(
    `/org/${props.entiteId}/document/new/edit?type=${selectedFlux.value}`,
  );
}

// Initialisés depuis l'URL pour survivre à un aller-retour vers le détail d'un document
// (le composant est démonté puis remonté, la query, elle, est conservée par router.back())
const pageActive = ref(Number(route.query.page) || 1);
const searchPage = ref(Number(route.query.page) || 1);
const search = ref(typeof route.query.search === "string" ? route.query.search : "");
const rowsPerPage = ref(Number(route.query.rows) || ITEMS_PER_PAGE);

const { documents, pagination, isFetching, isError, error } = useDocuments(
  toRef(props, "entiteId"),
  selectedFlux,
  pageActive,
  search,
  rowsPerPage,
);

watch(
  () => props.entiteId,
  () => {
    pageActive.value = 1;
    search.value = "";
    selectedFlux.value = null;
  },
);
watch(selectedFlux, () => {
  pageActive.value = 1;
  search.value = "";
});
watch(
  search,
  () => {
    searchPage.value = 1;
  },
  { flush: "sync" },
);
watch(rowsPerPage, () => {
  searchPage.value = 1;
  pageActive.value = 1;
});

// Filtres avancés
const showAdvanced = ref(false);
const filterEtat = ref<string | null>(null);
const filterDateDebut = ref<Date | null>(null);
const filterDateFin = ref<Date | null>(null);

const etatOptions = ref<{ label: string; value: string }[]>([]);
const etatLoading = ref(false);

async function fetchEtatOptions(fluxType: string) {
  etatLoading.value = true;
  etatOptions.value = [];
  try {
    const actions = await $fetch<Record<string, any>>(
      `/flux/${fluxType}/action`,
      {
        baseURL: config.public.apiBaseUrl,
        headers: { Authorization: `Bearer ${user.value?.token}` },
      },
    );
    etatOptions.value = Object.entries(actions).map(([value, action]) => ({
      label: action["name-action"] ?? action["name"] ?? value,
      value,
    }));
  } catch {
    etatOptions.value = [];
  } finally {
    etatLoading.value = false;
  }
}

watch(
  selectedFlux,
  (flux) => {
    filterEtat.value = null;
    if (flux) fetchEtatOptions(flux);
    else etatOptions.value = [];
  },
  { immediate: true },
);

function resetAdvancedFilters() {
  filterEtat.value = null;
  filterDateDebut.value = null;
  filterDateFin.value = null;
}

function applyAdvancedFilters() {
  // Je ferai après. Je declare juste la fonction
}

// Tri
type SortKey = "titre" | "type" | "last_action_message" | "last_action_date";
const sortKey = ref<SortKey>("last_action_date");
const sortAsc = ref(false);

const isSearching = computed(() => !!search.value.trim());

const sorted = computed(() => {
  const term = search.value.trim().toLowerCase();
  const base = term
    ? documents.value.filter((doc) =>
        [doc.titre, doc.type, doc.last_action_message, doc.last_action].some(
          (v) => v?.toLowerCase().includes(term),
        ),
      )
    : documents.value;

  return [...base].sort((a, b) => {
    const va = a[sortKey.value] ?? "";
    const vb = b[sortKey.value] ?? "";
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return sortAsc.value ? cmp : -cmp;
  });
});

const displayTotal = computed(() =>
  isSearching.value ? sorted.value.length : (pagination.value?.total ?? 0),
);
const displayedDocs = computed(() => {
  if (!isSearching.value) return sorted.value;
  const start = (searchPage.value - 1) * rowsPerPage.value;
  return sorted.value.slice(start, start + rowsPerPage.value);
});

const activePage = computed(() =>
  isSearching.value ? searchPage.value : pageActive.value,
);

// Reflète la pagination dans l'URL (sans ajouter d'entrée d'historique) pour la
// retrouver au retour depuis le détail d'un document
watch([activePage, search, rowsPerPage], ([page, s, rows]) => {
  router.replace({
    query: { ...route.query, page, search: s || undefined, rows },
  });
});

function onChangePage(p: number) {
  if (isSearching.value) searchPage.value = p;
  else pageActive.value = p;
}

function toggleSort(key: SortKey) {
  if (sortKey.value === key) sortAsc.value = !sortAsc.value;
  else {
    sortKey.value = key;
    sortAsc.value = true;
  }
}

function openDoc(doc: any) {
  router.push(`/org/${doc.id_e}/document/${doc.id_d}?type=${doc.type}`);
}

function prefetchDoc(doc: any) {
  if (!user.value?.token) return;
  queryClient.prefetchQuery({
    queryKey: ["document", doc.id_e, doc.id_d],
    queryFn: () =>
      $fetch(`/entite/${doc.id_e}/document/${doc.id_d}`, {
        baseURL: config.public.apiBaseUrl,
        headers: { Authorization: `Bearer ${user.value?.token}` },
      }),
    staleTime: 30_000,
  });
}

function editDoc(doc: any) {
  router.push(`/org/${doc.id_e}/document/${doc.id_d}/edit?type=${doc.type}`);
}

const actionLoading = ref<string | null>(null);

async function duplicateDoc(doc: any) {
  actionLoading.value = `duplicate_${doc.id_d}`;
  try {
    await $fetch(`/entite/${doc.id_e}/documents/perform_action`, {
      method: "POST",
      baseURL: config.public.apiBaseUrl,
      headers: { Authorization: `Bearer ${user.value?.token}` },
      body: { document_ids: doc.id_d, action: "duplicate" },
    });
    queryClient.invalidateQueries({
      queryKey: ["documents", Number(doc.id_e)],
    });
  } finally {
    actionLoading.value = null;
  }
}

async function deleteDoc(doc: any) {
  if (!confirm(`Supprimer « ${doc.titre || "ce document"} » ?`)) return;
  actionLoading.value = `delete_${doc.id_d}`;
  try {
    await $fetch(`/entite/${doc.id_e}/documents/perform_action`, {
      method: "POST",
      baseURL: config.public.apiBaseUrl,
      headers: { Authorization: `Bearer ${user.value?.token}` },
      body: { document_ids: doc.id_d, action: "supression" },
    });
    queryClient.invalidateQueries({
      queryKey: ["documents", Number(doc.id_e)],
    });
  } finally {
    actionLoading.value = null;
  }
}

function hasAction(doc: any, action: string) {
  return doc.action_possible?.some((a: any) => a.action === action);
}

// Icône + couleur pour les actions groupées connues ; les autres (Pastell en expose
// beaucoup, cf. GET /flux/{type}/action) reçoivent une icône générique plutôt que
// d'être cachées, comme le fait déjà DocumentDetail.vue au cas par cas
const BATCH_ACTION_CONFIG: Record<string, { icon: string; severity: string }> = {
  supression: { icon: "pi pi-trash", severity: "danger" },
  orientation: { icon: "pi pi-send", severity: "secondary" },
  "teletransmission-tdt": { icon: "pi pi-share-alt", severity: "secondary" },
  duplicate: { icon: "pi pi-copy", severity: "secondary" },
  "verif-tdt": { icon: "pi pi-search", severity: "secondary" },
  reouverture: { icon: "pi pi-refresh", severity: "secondary" },
  "annulation-tdt": { icon: "pi pi-times", severity: "danger" },
};
function batchActionIcon(action: string) {
  return BATCH_ACTION_CONFIG[action]?.icon ?? "pi pi-info-circle";
}
function batchActionSeverity(action: string) {
  return BATCH_ACTION_CONFIG[action]?.severity ?? "secondary";
}

// "modification" navigue vers le formulaire (cf. DocumentDetail.vue), elle n'a pas de
// sens comme action groupée exécutée en un clic sur perform_action
function isBatchable(doc: any, a: any) {
  return a.message && !(a.action === "modification" && doc.last_action === "termine") && a.action !== "modification";
}

// Sélection pour les actions groupées
const selected = ref<any[]>([]);
const runningBatchAction = ref<string | null>(null);
const batchResultMessage = ref<{ type: "success" | "error"; text: string } | null>(null);

// Enlève de la sélection les documents qui ne sont plus dans la page affichée
watch(displayedDocs, (docs) => {
  selected.value = selected.value.filter((s) =>
    docs.some((d) => d.id_d === s.id_d),
  );
});

// Case à cocher visible si le document a au moins une action groupable
function canBatchSelect(doc: any) {
  return doc.action_possible?.some((a: any) => isBatchable(doc, a));
}

function isSelected(doc: any) {
  return selected.value.some((d) => d.id_d === doc.id_d);
}

function toggleSelect(doc: any, checked: boolean) {
  selected.value = checked
    ? [...selected.value, doc]
    : selected.value.filter((d) => d.id_d !== doc.id_d);
}

// Actions communes à tous les documents sélectionnés (pas juste l'union : une action
// groupée doit pouvoir s'appliquer à chaque document sélectionné)
const availableActions = computed(() => {
  if (!selected.value.length) return [];
  const perDoc = selected.value.map((doc) =>
    (doc.action_possible ?? []).filter((a: any) => isBatchable(doc, a)),
  );
  const common = perDoc.reduce((acc, actions) =>
    acc.filter((a) => actions.some((b: any) => b.action === a.action)),
  );
  return common.map((a: any) => ({ value: a.action, label: a.message ?? a.action }));
});

async function executeBatchAction(action: string) {
  if (!selected.value.length) return;
  const count = selected.value.length;
  if (
    action === "supression" &&
    !confirm(`Confirmer la suppression de ${count} document${count > 1 ? "s" : ""} ?`)
  )
    return;
  runningBatchAction.value = action;
  batchResultMessage.value = null;
  try {
    await $fetch(`/entite/${props.entiteId}/documents/perform_action`, {
      method: "POST",
      baseURL: config.public.apiBaseUrl,
      headers: { Authorization: `Bearer ${user.value?.token}` },
      body: {
        document_ids: selected.value.map((d) => d.id_d),
        action,
      },
    });
    batchResultMessage.value = {
      type: "success",
      text: `${count} document${count > 1 ? "s" : ""} traité${count > 1 ? "s" : ""} avec succès.`,
    };
    selected.value = [];
    queryClient.invalidateQueries({ queryKey: ["documents", Number(props.entiteId)] });
  } catch (e: any) {
    batchResultMessage.value = {
      type: "error",
      text: e?.data?.detail ?? "Le lot n'a pas pu être traité entièrement.",
    };
  } finally {
    runningBatchAction.value = null;
  }
}
</script>

<template>
  <div class="w-full">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-xl font-semibold text-gray-900">
        {{ selectedFlux ? `Liste des ${selectedFlux}` : "Liste des documents" }}
      </h1>
      <div class="flex items-center gap-3">
        <Button
          v-if="selectedFlux"
          label="Créer un document"
          icon="pi pi-plus"
          severity="secondary"
          class="shrink-0"
          @click="createDoc"
        />
        <Button
          :icon="showAdvanced ? 'pi pi-filter-slash' : 'pi pi-filter'"
          :label="showAdvanced ? 'Masquer' : 'Filtres avancés'"
          severity="secondary"
          text
          class="whitespace-nowrap shrink-0"
          @click="showAdvanced = !showAdvanced"
        />
        <DocumentSearch v-model="search" />
      </div>
    </div>

    <!-- Panneau filtres avancés -->
    <div
      v-show="showAdvanced"
      class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4"
    >
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="flex flex-col gap-1">
          <label
            class="text-xs font-medium text-gray-500 uppercase tracking-wide"
            >État</label
          >
          <Select
            v-model="filterEtat"
            :options="etatOptions"
            :loading="etatLoading"
            :disabled="!selectedFlux"
            option-label="label"
            option-value="value"
            :placeholder="
              selectedFlux ? 'Tous les états' : 'Sélectionner un flux d\'abord'
            "
            show-clear
            class="w-full"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label
            class="text-xs font-medium text-gray-500 uppercase tracking-wide"
            >Depuis</label
          >
          <DatePicker
            v-model="filterDateDebut"
            date-format="dd/mm/yy"
            show-icon
            placeholder="Date de début"
            class="w-full"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label
            class="text-xs font-medium text-gray-500 uppercase tracking-wide"
            >Jusqu'au</label
          >
          <DatePicker
            v-model="filterDateFin"
            date-format="dd/mm/yy"
            show-icon
            placeholder="Date de fin"
            class="w-full"
          />
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-3">
        <Button
          label="Réinitialiser"
          severity="secondary"
          text
          size="small"
          @click="resetAdvancedFilters"
        />
        <Button
          label="Appliquer"
          icon="pi pi-search"
          size="small"
          @click="applyAdvancedFilters"
        />
      </div>
    </div>

    <!-- Skeleton premier chargement -->
    <div
      v-if="!props.entiteId || (isFetching && documents.length === 0)"
      class="overflow-x-auto rounded border border-gray-200"
    >
      <table class="min-w-full text-sm">
        <thead class="bg-white border-b border-gray-200">
          <tr>
            <th class="px-4 py-3">
              <Skeleton width="4rem" height="0.75rem" />
            </th>
            <th class="px-4 py-3 hidden sm:table-cell">
              <Skeleton width="6rem" height="0.75rem" />
            </th>
            <th class="px-4 py-3">
              <Skeleton width="5rem" height="0.75rem" />
            </th>
            <th class="px-4 py-3 hidden sm:table-cell">
              <Skeleton width="8rem" height="0.75rem" />
            </th>
            <th class="px-4 py-3">
              <Skeleton width="4rem" height="0.75rem" />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="i in ITEMS_PER_PAGE"
            :key="i"
            :class="i % 2 === 0 ? 'bg-white' : 'bg-gray-50'"
          >
            <td class="px-4 py-2">
              <Skeleton :width="`${50 + ((i * 17) % 35)}%`" height="0.75rem" />
            </td>
            <td class="px-4 py-2 hidden sm:table-cell">
              <Skeleton width="9rem" height="0.75rem" />
            </td>
            <td class="px-4 py-2">
              <Skeleton width="7rem" height="0.75rem" />
            </td>
            <td class="px-4 py-2 hidden sm:table-cell">
              <Skeleton width="8rem" height="0.75rem" />
            </td>
            <td class="px-4 py-2">
              <Skeleton width="5rem" height="0.75rem" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="isError" class="text-red-600 py-4">
      {{ error?.message }}
    </div>

    <!-- Table PrimeVue -->
    <div v-else :class="{ 'opacity-60 pointer-events-none': isFetching }">
      <DataTable
        :value="displayedDocs"
        striped-rows
        class="text-sm"
        @row-mouseenter="prefetchDoc($event.data)"
      >
        <template #empty>
          <div class="text-center py-8 text-gray-400 italic">
            Aucun document
          </div>
        </template>

        <!-- Sélection pour actions groupées -->
        <Column header-style="width:2.5rem">
          <template #body="{ data: doc }">
            <Checkbox
              v-if="canBatchSelect(doc)"
              :model-value="isSelected(doc)"
              binary
              @update:model-value="(checked: boolean) => toggleSelect(doc, checked)"
            />
          </template>
        </Column>

        <!-- Titre -->
        <Column field="titre">
          <template #header>
            <button
              class="font-semibold text-gray-700 cursor-pointer select-none whitespace-nowrap hover:text-gray-900"
              @click.stop="toggleSort('titre')"
            >
              Titre
              <span class="ml-1 text-gray-400 text-xs">{{
                sortKey === "titre" ? (sortAsc ? "↑" : "↓") : "↕"
              }}</span>
            </button>
          </template>
          <template #body="{ data: doc }">
            <button
              v-if="doc.titre"
              class="text-blue-600 hover:underline text-left"
              @click="openDoc(doc)"
            >
              {{ doc.titre }}
            </button>
            <span v-else class="italic text-gray-400">Non renseigné</span>
          </template>
        </Column>

        <!-- Type de dossier -->
        <Column
          v-if="!selectedFlux"
          field="type"
          header-class="hidden sm:table-cell"
          body-class="hidden sm:table-cell"
        >
          <template #header>
            <button
              class="font-semibold text-gray-700 cursor-pointer select-none whitespace-nowrap hover:text-gray-900"
              @click.stop="toggleSort('type')"
            >
              Type de dossier
              <span class="ml-1 text-gray-400 text-xs">{{
                sortKey === "type" ? (sortAsc ? "↑" : "↓") : "↕"
              }}</span>
            </button>
          </template>
          <template #body="{ data: doc }">
            <span class="text-gray-700">{{ doc.type }}</span>
          </template>
        </Column>

        <!-- Dernier état -->
        <Column field="last_action_message">
          <template #header>
            <button
              class="font-semibold text-gray-700 cursor-pointer select-none whitespace-nowrap hover:text-gray-900"
              @click.stop="toggleSort('last_action_message')"
            >
              Dernier état
              <span class="ml-1 text-gray-400 text-xs">{{
                sortKey === "last_action_message" ? (sortAsc ? "↑" : "↓") : "↕"
              }}</span>
            </button>
          </template>
          <template #body="{ data: doc }">
            <span class="text-gray-700">{{
              doc.last_action_message || doc.last_action || "—"
            }}</span>
          </template>
        </Column>

        <!-- Dernier changement d'état -->
        <Column
          field="last_action_date"
          header-class="hidden sm:table-cell"
          body-class="hidden sm:table-cell"
        >
          <template #header>
            <button
              class="font-semibold text-gray-700 cursor-pointer select-none whitespace-nowrap hover:text-gray-900"
              @click.stop="toggleSort('last_action_date')"
            >
              Dernier changement d'état
              <span class="ml-1 text-gray-400 text-xs">{{
                sortKey === "last_action_date" ? (sortAsc ? "↑" : "↓") : "↓"
              }}</span>
            </button>
          </template>
          <template #body="{ data: doc }">
            <span class="text-gray-600 tabular-nums">{{
              formatDate(doc.last_action_date)
            }}</span>
          </template>
        </Column>

        <!-- Actions -->
        <Column header-class="w-28">
          <template #header>
            <span class="font-semibold text-gray-700">Actions</span>
          </template>
          <template #body="{ data: doc }">
            <div class="flex items-center gap-1">
              <Button
                v-tooltip.top="'Visualiser'"
                icon="pi pi-eye"
                severity="secondary"
                text
                rounded
                size="small"
                @click="openDoc(doc)"
              />
              <Button
                v-if="hasAction(doc, 'modification')"
                v-tooltip.top="'Modifier'"
                icon="pi pi-file-edit"
                severity="secondary"
                text
                rounded
                size="small"
                @click="editDoc(doc)"
              />
              <Button
                v-if="hasAction(doc, 'duplicate')"
                v-tooltip.top="'Dupliquer'"
                icon="pi pi-copy"
                severity="secondary"
                text
                rounded
                size="small"
                :loading="actionLoading === `duplicate_${doc.id_d}`"
                @click="duplicateDoc(doc)"
              />
              <Button
                v-if="hasAction(doc, 'supression')"
                v-tooltip.top="'Supprimer'"
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                size="small"
                :loading="actionLoading === `delete_${doc.id_d}`"
                @click="deleteDoc(doc)"
              />
            </div>
          </template>
        </Column>
      </DataTable>

      <!-- Ligne de pagination : actions groupées à gauche, pagination centrée -->
      <div class="grid grid-cols-[1fr_auto_1fr] items-center mt-2 gap-3">
        <div v-if="selected.length" class="flex items-center gap-1">
          <Button
            v-for="a in availableActions"
            :key="a.value"
            v-tooltip.top="a.label"
            :icon="batchActionIcon(a.value)"
            :severity="batchActionSeverity(a.value)"
            text
            rounded
            :loading="runningBatchAction === a.value"
            :disabled="!!runningBatchAction && runningBatchAction !== a.value"
            @click="executeBatchAction(a.value)"
          />
        </div>
        <div v-else />

        <Paginator
          v-if="displayTotal > 0"
          :rows="rowsPerPage"
          :total-records="displayTotal"
          :first="(activePage - 1) * rowsPerPage"
          :rows-per-page-options="[5, 10, 20, 50]"
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          @page="
            (e) => {
              rowsPerPage = e.rows;
              onChangePage(e.page + 1);
            }
          "
        />
        <div />
      </div>

      <div
        v-if="batchResultMessage"
        class="mt-2 text-sm px-4 py-3 rounded border w-full"
        :class="
          batchResultMessage.type === 'success'
            ? 'text-green-700 bg-green-50 border-green-300'
            : 'text-red-700 bg-red-50 border-red-300'
        "
      >
        {{ batchResultMessage.text }}
      </div>
    </div>
  </div>
</template>
