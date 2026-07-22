<script setup lang="ts">
import { useQueryClient } from "@tanstack/vue-query";
import type { AdvancedFilters } from "~/composables/useDocuments";

const props = defineProps<{
  entiteId: number | undefined;
}>();

const config = useRuntimeConfig();
const router = useRouter();
const route = useRoute();
const { user, selectedFlux } = useUserContext();
const queryClient = useQueryClient();

// Création / navigation -------------------------------
async function createDoc() {
  if (!selectedFlux.value) return;
  await navigateTo(
      `/org/${props.entiteId}/document/new/edit?type=${selectedFlux.value}`,
  );
}

async function openDoc(doc: any) {
  await navigateTo(`/org/${doc.id_e}/document/${doc.id_d}?type=${doc.type}`);
}

async function editDoc(doc: any) {
  await navigateTo(`/org/${doc.id_e}/document/${doc.id_d}/edit?type=${doc.type}`);
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

// Filtres avancés ---------------------------------
const showAdvanced = ref(false);
const filterEtat = ref<string | null>(null);
const filterDateDebut = ref<Date | null>(null);
const filterDateFin = ref<Date | null>(null);
const filterEtatTransit = ref<string | null>(null);
const filterStateBegin = ref<Date | null>(null);
const filterStateEnd = ref<Date | null>(null);

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

// Filtres envoyés au backend
const advancedFilters = ref<AdvancedFilters>({});

function resetAdvancedFilters() {
  filterEtat.value = null;
  filterDateDebut.value = null;
  filterDateFin.value = null;
  filterEtatTransit.value = null;
  filterStateBegin.value = null;
  filterStateEnd.value = null;
  advancedFilters.value = {};
}

function applyAdvancedFilters() {
  advancedFilters.value = {
    etat: filterEtat.value,
    etatDebut: filterDateDebut.value,
    etatFin: filterDateFin.value,
    etatTransit: filterEtatTransit.value,
    etatTransitDebut: filterStateBegin.value,
    etatTransitFin: filterStateEnd.value,
  };
}

watch(
    selectedFlux,
    (flux) => {
      resetAdvancedFilters();
      if (flux) fetchEtatOptions(flux);
      else etatOptions.value = [];
    },
    { immediate: true },
);

// Pagination et Recherche (100% Serveur via lazy loading) -----------------
const pageActive = ref(Number(route.query.page) || 1);
const search = ref(typeof route.query.search === "string" ? route.query.search : "");
const rowsPerPage = ref(Number(route.query.rows) || ITEMS_PER_PAGE);

const { documents, pagination, isFetching, isError, error } = useDocuments(
    toRef(props, "entiteId"),
    selectedFlux,
    pageActive,
    search,
    rowsPerPage,
    advancedFilters,
);

// Branchement des actions groupées via le composable externe
const {
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
  closeBatchResult,
  duplicateDoc,
  deleteDoc,
} = useBatchDocuments(toRef(props, "entiteId"), documents);

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

watch([search, rowsPerPage, advancedFilters], () => {
  pageActive.value = 1;
});

// Synchronisation dans l'URL sans polluer l'historique de navigation
watch([pageActive, search, rowsPerPage], ([page, s, rows]) => {
  router.replace({
    query: { ...route.query, page, search: s || undefined, rows },
  });
});

// Le total n'est pas correct quand la recherch est par les filtres. Pour l'instant sans filtre pagination et avec pas de pagination.
const hasActiveFilter = computed(() => {
  const f = advancedFilters.value;
  return !!search.value.trim() || !!(f.etat || f.etatDebut || f.etatFin || f.etatTransit || f.etatTransitDebut || f.etatTransitFin);
});

function onChangePage(p: number) {
  pageActive.value = p;
}
</script>

<template>
  <div class="w-full h-full flex flex-col min-h-0">
    <!-- Topbar : titre et boutons d'action -->
    <div class="shrink-0 flex justify-between items-center mb-4">
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
        class="shrink-0 bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4"
    >
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">Dernier état</label>
          <Select
              v-model="filterEtat"
              :options="etatOptions"
              :loading="etatLoading"
              :disabled="!selectedFlux"
              option-label="label"
              option-value="value"
              :placeholder="selectedFlux ? 'Tous les états' : 'Sélectionner un flux d\'abord'"
              show-clear
              class="w-full"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">Depuis</label>
          <DatePicker
              v-model="filterDateDebut"
              date-format="dd/mm/yy"
              show-icon
              placeholder="Date de début"
              class="w-full"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">Jusqu'au</label>
          <DatePicker
              v-model="filterDateFin"
              date-format="dd/mm/yy"
              show-icon
              placeholder="Date de fin"
              class="w-full"
          />
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">État transitoire</label>
          <Select
              v-model="filterEtatTransit"
              :options="etatOptions"
              :loading="etatLoading"
              :disabled="!selectedFlux"
              option-label="label"
              option-value="value"
              :placeholder="selectedFlux ? 'Le document doit être passé par cet état' : 'Sélectionner un flux d\'abord'"
              show-clear
              class="w-full"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">Depuis</label>
          <DatePicker
              v-model="filterStateBegin"
              date-format="dd/mm/yy"
              show-icon
              placeholder="Date de début"
              class="w-full"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">Jusqu'au</label>
          <DatePicker
              v-model="filterStateEnd"
              date-format="dd/mm/yy"
              show-icon
              placeholder="Date de fin"
              class="w-full"
          />
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-3">
        <Button label="Réinitialiser" severity="secondary" text size="small" @click="resetAdvancedFilters" />
        <Button label="Appliquer" icon="pi pi-search" size="small" @click="applyAdvancedFilters" />
      </div>
    </div>

    <!-- Barre d'actions groupées -->
    <div
        v-if="selected.length"
        class="shrink-0 flex items-center justify-between bg-white border-b border-gray-200 px-2 py-2 mb-4"
    >
      <span class="text-sm text-gray-500">
        {{ selected.length }} document{{ selected.length > 1 ? "s" : "" }} sélectionné{{ selected.length > 1 ? "s" : "" }}
      </span>
      <div class="flex items-center gap-1">
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
    </div>

    <!-- Zone scrollable -->
    <div class="flex-1 overflow-y-auto min-h-0">
      <!-- Skeleton premier chargement -->
      <div
          v-if="!props.entiteId || (isFetching && documents.length === 0)"
          class="overflow-x-auto rounded border border-gray-200"
      >
        <table class="min-w-full text-sm">
          <thead class="bg-white border-b border-gray-200">
          <tr>
            <th class="px-4 py-3"><Skeleton width="4rem" height="0.75rem" /></th>
            <th class="px-4 py-3 hidden sm:table-cell"><Skeleton width="6rem" height="0.75rem" /></th>
            <th class="px-4 py-3"><Skeleton width="5rem" height="0.75rem" /></th>
            <th class="px-4 py-3 hidden sm:table-cell"><Skeleton width="8rem" height="0.75rem" /></th>
            <th class="px-4 py-3"><Skeleton width="4rem" height="0.75rem" /></th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="i in ITEMS_PER_PAGE" :key="i" :class="i % 2 === 0 ? 'bg-white' : 'bg-gray-50'">
            <td class="px-4 py-2"><Skeleton :width="`${50 + ((i * 17) % 35)}%`" height="0.75rem" /></td>
            <td class="px-4 py-2 hidden sm:table-cell"><Skeleton width="9rem" height="0.75rem" /></td>
            <td class="px-4 py-2"><Skeleton width="7rem" height="0.75rem" /></td>
            <td class="px-4 py-2 hidden sm:table-cell"><Skeleton width="8rem" height="0.75rem" /></td>
            <td class="px-4 py-2"><Skeleton width="5rem" height="0.75rem" /></td>
          </tr>
          </tbody>
        </table>
      </div>

      <div v-else-if="isError" class="text-red-600 py-4">
        {{ error?.message }}
      </div>

      <!-- Table PrimeVue en mode Lazy -->
      <div v-else :class="{ 'opacity-60 pointer-events-none': isFetching }">
        <DataTable
            :value="documents"
            :lazy="true"
            striped-rows
            class="text-sm"
        >
          <template #empty>
            <div class="text-center py-8 text-gray-400 italic">Aucun document</div>
          </template>

          <!-- Sélection pour actions groupées -->
          <Column header-class="w-10" body-class="w-10">
            <template #header>
              <Checkbox
                  v-if="batchableDocs.length"
                  :model-value="allSelected"
                  :indeterminate="someSelected"
                  binary
                  @update:model-value="toggleSelectAll"
              />
            </template>
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
          <Column field="titre" header="Titre">
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
              header="Type de dossier"
              header-class="hidden sm:table-cell"
              body-class="hidden sm:table-cell"
          >
            <template #body="{ data: doc }">
              <span class="text-gray-700">{{ doc.type }}</span>
            </template>
          </Column>

          <!-- Dernier état -->
          <Column field="last_action_message" header="Dernier état">
            <template #body="{ data: doc }">
              <span class="text-gray-700">{{ doc.last_action_message || doc.last_action || "—" }}</span>
            </template>
          </Column>

          <!-- Dernier changement d'état -->
          <Column
              field="last_action_date"
              header="Dernier changement d'état"
              header-class="hidden sm:table-cell"
              body-class="hidden sm:table-cell"
          >
            <template #body="{ data: doc }">
              <span class="text-gray-600 tabular-nums">{{ formatDate(doc.last_action_date) }}</span>
            </template>
          </Column>

          <!-- Actions -->
          <Column header="Actions" header-class="w-28">
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

        <!-- Pagination -->
        <div class="flex justify-center mt-2">
          <Paginator
              v-if="(pagination?.total ?? 0) > 0"
              :rows="rowsPerPage"
              :total-records="pagination?.total ?? 0"
              :first="(pageActive - 1) * rowsPerPage"
              :rows-per-page-options="[5, 10, 20]"
              :template="hasActiveFilter
              ? 'PrevPageLink CurrentPageReport NextPageLink RowsPerPageDropdown'
              : 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown'"
              :current-page-report-template="hasActiveFilter ? 'Page {currentPage}' : '{first} - {last} of {totalRecords}'"
              @page="
              (e) => {
                rowsPerPage = e.rows;
                onChangePage(e.page + 1);
              }
            "
          />
        </div>

        <div
            v-if="batchResultMessage"
            class="fixed bottom-6 left-6 z-50 flex items-center gap-4 text-sm px-4 py-3 rounded-lg border shadow-lg"
            :class="
            batchResultMessage.type === 'success'
              ? 'text-green-800 bg-green-50 border-green-200'
              : 'text-red-800 bg-red-50 border-red-200'
          "
        >
          <span>{{ batchResultMessage.text }}</span>
          <button
              class="text-current opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Fermer"
              @click="closeBatchResult"
          >
            <i class="pi pi-times text-xs" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>