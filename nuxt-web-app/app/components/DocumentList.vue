<script setup lang="ts">
import { ITEMS_PER_PAGE } from "~/composables/useDocuments";

const props = defineProps<{
  entiteId: number;
  idFlux?: string | null;
}>();

const router = useRouter();

const pageActive = ref(1); // pilote la requête API
const searchPage = ref(1); // pilote la pagination des résultats filtrés
const entiteIdRef = computed(() => props.entiteId);
const idFluxRef = computed(() => props.idFlux ?? null);

const search = ref("");

const {
  documents,
  pagination,
  totalPages,
  isFetching,
  isError,
  error,
} = useDocuments(entiteIdRef, idFluxRef, pageActive, search);

watch(
  entiteIdRef,
  () => {
    pageActive.value = 1;
    search.value = "";
  },
);
watch(
  idFluxRef,
  () => {
    pageActive.value = 1;
    search.value = "";
  },
);
watch(
  search,
  () => {
    searchPage.value = 1;
  },
  { flush: "sync" },
);

// Tri
type SortKey = "titre" | "type" | "last_action_message" | "last_action_date";
const sortKey = ref<SortKey>("last_action_date");
const sortAsc = ref(false);

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
  search.value.trim() ? sorted.value.length : (pagination.value?.total ?? 0),
);
const displayTotalPages = computed(() =>
  search.value.trim()
    ? Math.ceil(sorted.value.length / ITEMS_PER_PAGE)
    : totalPages.value,
);
const displayedDocs = computed(() => {
  if (!search.value.trim()) return sorted.value;
  const start = (searchPage.value - 1) * ITEMS_PER_PAGE;
  return sorted.value.slice(start, start + ITEMS_PER_PAGE);
});

const activePage = computed(() =>
  search.value.trim() ? searchPage.value : pageActive.value,
);

function onChangePage(p: number) {
  if (search.value.trim()) searchPage.value = p;
  else pageActive.value = p;
}

function toggleSort(key: SortKey) {
  if (sortKey.value === key) sortAsc.value = !sortAsc.value;
  else {
    sortKey.value = key;
    sortAsc.value = true;
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// ── Actions ──────────────────────────────────────────────────────────────────

function openDoc(doc: any) {
  router.push(`/org/${doc.id_e}/document/${doc.id_d}`);
}

</script>

<template>
  <div class="w-full">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-xl font-semibold text-gray-900">
        {{ idFlux ? `Liste des ${idFlux}` : "Liste des documents" }}
      </h1>
      <DocumentSearch v-model="search" />
    </div>

    <!-- Skeleton premier chargement -->
    <div
      v-if="isFetching && documents.length === 0"
      class="overflow-x-auto rounded border border-gray-200"
    >
      <table class="min-w-full text-sm">
        <thead class="bg-white border-b border-gray-200">
          <tr>
            <th class="px-4 py-3">
              <div class="h-3 w-16 bg-gray-200 rounded animate-pulse" />
            </th>
            <th class="px-4 py-3 hidden sm:table-cell">
              <div class="h-3 w-24 bg-gray-200 rounded animate-pulse" />
            </th>
            <th class="px-4 py-3">
              <div class="h-3 w-20 bg-gray-200 rounded animate-pulse" />
            </th>
            <th class="px-4 py-3 hidden sm:table-cell">
              <div class="h-3 w-32 bg-gray-200 rounded animate-pulse" />
            </th>
            <th class="px-4 py-3">
              <div class="h-3 w-16 bg-gray-200 rounded animate-pulse" />
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
              <div
                class="h-3 bg-gray-100 rounded animate-pulse"
                :style="`width: ${50 + ((i * 17) % 35)}%`"
              />
            </td>
            <td class="px-4 py-2 hidden sm:table-cell">
              <div class="h-3 w-36 bg-gray-100 rounded animate-pulse" />
            </td>
            <td class="px-4 py-2">
              <div class="h-3 w-28 bg-gray-100 rounded animate-pulse" />
            </td>
            <td class="px-4 py-2 hidden sm:table-cell">
              <div class="h-3 w-32 bg-gray-100 rounded animate-pulse" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="isError" class="text-red-600 py-4">
      {{ error?.message }}
    </div>

    <!-- Table réelle -->
    <div
      v-else
      class="overflow-x-auto rounded border border-gray-200"
      :class="{ 'opacity-60 pointer-events-none': isFetching }"
    >
      <table class="min-w-full text-sm text-left text-gray-800">
        <thead class="bg-white border-b border-gray-200">
          <tr>
            <th
              class="px-4 py-3 font-semibold text-gray-700 cursor-pointer select-none whitespace-nowrap hover:text-gray-900"
              @click="toggleSort('titre')"
            >
              Titre
              <span class="ml-1 text-gray-400 text-xs">{{
                sortKey === "titre" ? (sortAsc ? "↑" : "↓") : "↕"
              }}</span>
            </th>
            <th
              v-if="!idFlux"
              class="px-4 py-3 font-semibold text-gray-700 cursor-pointer select-none whitespace-nowrap hover:text-gray-900 hidden sm:table-cell"
              @click="toggleSort('type')"
            >
              Type de dossier
              <span class="ml-1 text-gray-400 text-xs">{{
                sortKey === "type" ? (sortAsc ? "↑" : "↓") : "↕"
              }}</span>
            </th>
            <th
              class="px-4 py-3 font-semibold text-gray-700 cursor-pointer select-none whitespace-nowrap hover:text-gray-900"
              @click="toggleSort('last_action_message')"
            >
              Dernier état
              <span class="ml-1 text-gray-400 text-xs">{{
                sortKey === "last_action_message" ? (sortAsc ? "↑" : "↓") : "↕"
              }}</span>
            </th>
            <th
              class="px-4 py-3 font-semibold text-gray-700 cursor-pointer select-none whitespace-nowrap hover:text-gray-900 hidden sm:table-cell"
              @click="toggleSort('last_action_date')"
            >
              Dernier changement d'état
              <span class="ml-1 text-gray-400 text-xs">{{
                sortKey === "last_action_date" ? (sortAsc ? "↑" : "↓") : "↓"
              }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="displayedDocs.length === 0">
            <td
              :colspan="idFlux ? 3 : 4"
              class="text-center py-8 text-gray-400 italic"
            >
              Aucun document
            </td>
          </tr>
          <tr
            v-for="(doc, index) in displayedDocs"
            :key="doc.id_d"
            :class="index % 2 === 0 ? 'bg-white' : 'bg-gray-50'"
            class="hover:bg-blue-50 transition-colors"
          >
            <!-- Titre -->
            <td class="px-4 py-2 whitespace-normal">
              <button
                v-if="doc.titre"
                class="text-blue-600 hover:underline text-left"
                @click="openDoc(doc)"
              >
                {{ doc.titre }}
              </button>
              <span v-else class="italic text-gray-400">Non renseigné</span>
            </td>

            <!-- Type -->
            <td
              v-if="!idFlux"
              class="px-4 py-2 text-gray-700 hidden sm:table-cell"
            >
              {{ doc.type }}
            </td>

            <!-- État -->
            <td class="px-4 py-2 text-gray-700">
              {{ doc.last_action_message || doc.last_action || "—" }}
            </td>

            <!-- Date -->
            <td
              class="px-4 py-2 text-gray-600 hidden sm:table-cell tabular-nums"
            >
              {{ formatDate(doc.last_action_date) }}
            </td>
          </tr>
        </tbody>
      </table>

      <div
        v-if="displayTotalPages > 1"
        class="border-t border-gray-200 px-4 py-2 bg-white"
      >
        <AppPagination
          :total-pages="displayTotalPages"
          :page-active="activePage"
          @change-page="onChangePage"
        />
      </div>
    </div>

    <div v-if="displayTotal > 0" class="mt-2 text-xs text-gray-400 text-right">
      {{ (activePage - 1) * ITEMS_PER_PAGE + 1 }}–{{
        Math.min(activePage * ITEMS_PER_PAGE, displayTotal)
      }}
      sur {{ displayTotal }} document{{ displayTotal !== 1 ? "s" : "" }}
    </div>
  </div>
</template>
