<script setup lang="ts">
import { ITEMS_PER_PAGE } from "~/composables/useDocuments";

const router = useRouter();
const route = useRoute();
const selectedFlux = useSelectedFlux();
const entiteId = useSelectedEntiteId();
const queryClient = useQueryClient();
const apiFetch = useApiFetch();

// Seed SSR uniquement si entiteId est déjà prêt, sinon useDocuments fera le fetch client normal.
if (import.meta.server && entiteId.value) {
  const initialSearch =
    typeof route.query.search === "string" ? route.query.search : "";
  const initialRows = Number(route.query.rows) || ITEMS_PER_PAGE;

  const { data: firstPage } = await useFetch("/api/documents/firstpage", {
    params: {
      entiteId: entiteId.value,
      idFlux: selectedFlux.value,
      docsPerPage: initialRows,
    },
  });

  // pour la 1ère page
  if (firstPage.value && !initialSearch) {
    queryClient.setQueryData(
      [
        "documents",
        entiteId.value,
        selectedFlux.value ?? null,
        0,
        initialRows,
        initialSearch,
        {},
      ],
      firstPage.value
    );
  }
}

function openDoc(doc: DocumentInfo) {
  queryClient.setQueryData(["document", doc.id_e, doc.id_d], {
    info: {
      id_d: doc.id_d,
      titre: doc.titre,
      type: doc.type,
      creation: null,
      modification: null,
    },
    last_action: doc.last_action,
    last_action_message: doc.last_action_message,
    last_action_date: doc.last_action_date,
    action_possible: doc.action_possible ?? [],
    data: {},
  });
  queryClient.invalidateQueries({ queryKey: ["document", doc.id_e, doc.id_d] });
  router.push(`/org/${doc.id_e}/document/${doc.id_d}?type=${doc.type}`);
}

function editDoc(doc: DocumentInfo) {
  router.push(`/org/${doc.id_e}/document/${doc.id_d}/edit?type=${doc.type}`);
}

const showAdvanced = ref(false);
const filterEtat = ref<string | null>(null);
const filterDateDebut = ref<Date | null>(null);
const filterDateFin = ref<Date | null>(null);
const filterEtatTransit = ref<string | null>(null);
const filterDateDebutTransit = ref<Date | null>(null);
const filterDateFinTransit = ref<Date | null>(null);

const etatOptions = ref<{ label: string; value: string }[]>([]);
const etatLoading = ref(false);

// useState (pas un const local) : persiste entre montages, sinon recréé vide à chaque
// aller-retour entre la fiche détail et la liste.
const etatOptionsCache = useState<
  Record<string, { label: string; value: string }[]>
>("etatOptionsCache", () => ({}));

async function fetchEtatOptions(fluxType: string) {
  if (etatOptionsCache.value[fluxType]) {
    etatOptions.value = etatOptionsCache.value[fluxType];
    return;
  }
  etatLoading.value = true;
  etatOptions.value = [];
  try {
    const actions = await apiFetch<FluxActions>(`/flux/${fluxType}/action`);
    const options = Object.entries(actions).map(([value, action]) => ({
      label: action["name-action"] ?? action["name"] ?? value,
      value,
    }));
    etatOptionsCache.value[fluxType] = options;
    etatOptions.value = options;
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
  filterDateDebutTransit.value = null;
  filterDateFinTransit.value = null;
  advancedFilters.value = {};
}

function applyAdvancedFilters() {
  advancedFilters.value = {
    etat: filterEtat.value,
    etatDebut: filterDateDebut.value,
    etatFin: filterDateFin.value,
    etatTransit: filterEtatTransit.value,
    etatTransitDebut: filterDateDebutTransit.value,
    etatTransitFin: filterDateFinTransit.value,
  };
}

watch(
  selectedFlux,
  (flux) => {
    resetAdvancedFilters();
    if (flux) fetchEtatOptions(flux);
    else etatOptions.value = [];
  },
  { immediate: true }
);

// Pagination et Recherche (100% serveur, gérées dans useDocuments) -----------------
const pageActive = ref(Number(route.query.page) || 1);
const search = ref(
  typeof route.query.search === "string" ? route.query.search : ""
);
const rowsPerPage = ref(Number(route.query.rows) || ITEMS_PER_PAGE);

const { documents, pagination, isFetching, isError, error } = useDocuments(
  entiteId,
  selectedFlux,
  pageActive,
  search,
  rowsPerPage,
  advancedFilters
);

const {
  selected,
  runningBatchAction,
  batchResultMessage,
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
} = useBatchDocuments(entiteId, documents);

watch(entiteId, () => {
  pageActive.value = 1;
  search.value = "";
  selectedFlux.value = null;
});
watch(selectedFlux, () => {
  pageActive.value = 1;
  search.value = "";
});
watch([search, rowsPerPage, advancedFilters], () => {
  pageActive.value = 1;
});

watch([pageActive, search, rowsPerPage], ([page, s, rows]) => {
  router.replace({
    query: { ...route.query, page, search: s || undefined, rows },
  });
});

// Pas de total fiable côté Pastell avec un filtre actif : pagination Précédent/Suivant seule.
const hasActiveFilter = computed(() => {
  const f = advancedFilters.value;
  return (
    !!search.value.trim() ||
    !!(
      f.etat ||
      f.etatDebut ||
      f.etatFin ||
      f.etatTransit ||
      f.etatTransitDebut ||
      f.etatTransitFin
    )
  );
});

function onChangePage(p: number) {
  pageActive.value = p;
}
</script>

<template>
  <div class="w-full h-full flex flex-col min-h-0">
    <div class="shrink-0 flex justify-between items-center mb-4">
      <h1 class="text-xl font-semibold text-gray-900">
        {{ selectedFlux ? `Liste des ${selectedFlux}` : "Liste des documents" }}
      </h1>
      <div class="flex items-center gap-3">
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

    <div
      v-show="showAdvanced"
      class="shrink-0 bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4"
    >
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="flex flex-col gap-1">
          <label
            class="text-xs font-medium text-gray-500 uppercase tracking-wide"
            >Dernier état</label
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
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <div class="flex flex-col gap-1">
          <label
            class="text-xs font-medium text-gray-500 uppercase tracking-wide"
            >État transitoire</label
          >
          <Select
            v-model="filterEtatTransit"
            :options="etatOptions"
            :loading="etatLoading"
            :disabled="!selectedFlux"
            option-label="label"
            option-value="value"
            :placeholder="
              selectedFlux
                ? 'Le document doit être passé par cet état'
                : 'Sélectionner un flux d\'abord'
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
            v-model="filterDateDebutTransit"
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
            v-model="filterDateFinTransit"
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

    <div
      v-if="selected.length"
      class="shrink-0 flex items-center justify-between bg-white border-b border-gray-200 px-2 py-2 mb-4"
    >
      <span class="text-sm text-gray-500">
        {{ selected.length }} document{{
          selected.length > 1 ? "s" : ""
        }}
        sélectionné{{ selected.length > 1 ? "s" : "" }}
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

    <div class="flex-1 overflow-y-auto min-h-0">
      <div
        v-if="!entiteId || (isFetching && documents.length === 0)"
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
                <Skeleton
                  :width="`${50 + ((i * 17) % 35)}%`"
                  height="0.75rem"
                />
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

      <div v-else :class="{ 'opacity-60 pointer-events-none': isFetching }">
        <DataTable :value="documents" striped-rows class="text-sm">
          <template #empty>
            <div class="text-center py-8 text-gray-400 italic">
              Aucun document
            </div>
          </template>

          <!-- Sélection pour actions groupées -->
          <Column header-class="w-10" body-class="w-10">
            <template #header>
              <Checkbox
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
                @update:model-value="
                  (checked: boolean) => toggleSelect(doc, checked)
                "
              />
            </template>
          </Column>

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

          <Column field="last_action_message" header="Dernier état">
            <template #body="{ data: doc }">
              <span class="text-gray-700">{{
                doc.last_action_message || doc.last_action || "—"
              }}</span>
            </template>
          </Column>

          <Column
            field="last_action_date"
            header="Dernier changement d'état"
            header-class="hidden sm:table-cell"
            body-class="hidden sm:table-cell"
          >
            <template #body="{ data: doc }">
              <span class="text-gray-600 tabular-nums">{{
                formatDate(doc.last_action_date)
              }}</span>
            </template>
          </Column>

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
                  v-if="canDuplicate(doc)"
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

        <div class="flex justify-center mt-2">
          <div
            v-if="hasActiveFilter && (pagination?.total ?? 0) > 0"
            class="flex items-center gap-3"
          >
            <Button
              icon="pi pi-chevron-left"
              text
              rounded
              severity="secondary"
              :disabled="pageActive <= 1"
              @click="onChangePage(pageActive - 1)"
            />
            <span class="text-sm text-gray-600">Page {{ pageActive }}</span>
            <Button
              icon="pi pi-chevron-right"
              text
              rounded
              severity="secondary"
              :disabled="!pagination?.next"
              @click="onChangePage(pageActive + 1)"
            />
            <Select
              v-model="rowsPerPage"
              :options="[5, 10, 20, 50]"
              class="w-24 text-sm"
            />
          </div>

          <Paginator
            v-else-if="(pagination?.total ?? 0) > 0"
            :rows="rowsPerPage"
            :total-records="pagination?.total ?? 0"
            :first="(pageActive - 1) * rowsPerPage"
            :rows-per-page-options="[5, 10, 20, 50]"
            template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            current-page-report-template="{first} - {last} of {totalRecords}"
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
