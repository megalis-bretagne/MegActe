<script setup lang="ts">
import { ITEMS_PER_PAGE } from "~/composables/useDocuments";
import { useQueryClient } from "@tanstack/vue-query";

const props = defineProps<{
  entiteId: number | undefined;
}>();

const { data: firstPage } = await useFetch("/api/documents/firstpage", {
  params: {
    entiteId: props.entiteId,
    idFlux: props.idFlux,
    docsPerPage: ITEMS_PER_PAGE,
  },
});

const router = useRouter();
const { user, selectedFlux } = useUserContext();
const queryClient = useQueryClient();

function createDoc() {
  if (!selectedFlux.value) return;
  router.push(
    `/org/${props.entiteId}/document/new/edit?type=${selectedFlux.value}`
  );
}

const pageActive = ref(1);
const searchPage = ref(1);
const search = ref("");
const rowsPerPage = ref(ITEMS_PER_PAGE);

const {
  documents,
  pagination,
  totalPages,
  isFetching,
  isError,
  error,
  invalidate,
} = useDocuments(
  toRef(props, "entiteId"),
  selectedFlux,
  pageActive,
  search,
  rowsPerPage
);

watch(
  () => props.entiteId,
  () => {
    pageActive.value = 1;
    search.value = "";
    selectedFlux.value = null;
  }
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
  { flush: "sync" }
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
      }
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
  { immediate: true }
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
          (v) => v?.toLowerCase().includes(term)
        )
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
  isSearching.value ? sorted.value.length : (pagination.value?.total ?? 0)
);
const displayedDocs = computed(() => {
  if (!isSearching.value) return sorted.value;
  const start = (searchPage.value - 1) * rowsPerPage.value;
  return sorted.value.slice(start, start + rowsPerPage.value);
});

const activePage = computed(() =>
  isSearching.value ? searchPage.value : pageActive.value
);

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
  actionLoading.value = doc.id_d;
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
  actionLoading.value = doc.id_d;
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
                :loading="actionLoading === doc.id_d"
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
                :loading="actionLoading === doc.id_d"
                @click="deleteDoc(doc)"
              />
            </div>
          </template>
        </Column>
      </DataTable>

      <Paginator
        v-if="displayTotal > 0"
        :rows="rowsPerPage"
        :total-records="displayTotal"
        :first="(activePage - 1) * rowsPerPage"
        :rows-per-page-options="[5, 10, 20, 50]"
        template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
        current-page-report-template="{first} à {last} sur {totalRecords}"
        @page="
          (e) => {
            rowsPerPage = e.rows;
            onChangePage(e.page + 1);
          }
        "
      />
    </div>
  </div>
</template>
