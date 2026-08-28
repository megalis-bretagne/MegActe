<script setup lang="ts">
// "Chart" est exclu de l'auto-registration PrimeVue par défaut (dépendance chart.js
// optionnelle) : import explicite requis, cf. doc PrimeVue.
import Chart from "primevue/chart";

useHead({ title: "Tableau de bord" });

const entiteId = useSelectedEntiteId();
const selectedFlux = useSelectedFlux();
const router = useRouter();
const queryClient = useQueryClient();

// useLazyFetch (pas useFetch+await) : ne bloque pas le <Suspense>, le tableau principal
// s'affiche direct, les widgets dépendant des flux se remplissent après.
const { data: fluxList, pending: fluxListPending } =
  useLazyFetch("/api/user/flux");

const fluxItems = computed<FluxItem[]>(() =>
  Object.entries(fluxList.value ?? {}).map(([id, f]: [string, Flux]) => ({
    id,
    nom: f.nom ?? id,
  }))
);

const fluxNameById = computed<Record<string, string>>(() =>
  Object.fromEntries(fluxItems.value.map((f) => [f.id, f.nom]))
);

const {
  fluxCounts,
  total,
  periods,
  series: trendSeries,
  isFetching: isFetchingFluxStats,
} = useFluxStats(entiteId, fluxItems);

const fluxStatsLoading = computed(
  () => fluxListPending.value || isFetchingFluxStats.value
);

// Couleur unique (pas une par barre) : une seule série de documents, pas de légende utile.
const chartData = computed(() => ({
  labels: fluxCounts.value.map((f) => f.nom),
  datasets: [
    {
      label: "Documents",
      data: fluxCounts.value.map((f) => f.total),
      backgroundColor: "#2563eb",
      borderRadius: 4,
      maxBarThickness: 28,
    },
  ],
}));

function goToFlux(index: number) {
  const flux = fluxCounts.value[index];
  if (!flux) return;
  selectedFlux.value = flux.id;
  router.push("/documents");
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  onClick: (_event: unknown, elements: { index: number }[]) => {
    const el = elements[0];
    if (el) goToFlux(el.index);
  },
  onHover: (
    event: { native?: { target: HTMLElement } },
    elements: unknown[]
  ) => {
    if (event.native?.target) {
      event.native.target.style.cursor = elements.length
        ? "pointer"
        : "default";
    }
  },
  plugins: {
    legend: { display: false },
  },
  scales: {
    x: { grid: { display: false } },
    y: {
      beginAtZero: true,
      ticks: { precision: 0 },
      grid: { color: "#e5e7eb" },
    },
  },
};

// Palette catégorielle validée (ordre fixe, jamais réassigné selon le classement
// par volume) : cf. skill dataviz, référence 8 teintes, adjacent-pairs OK sur line chart.
const CATEGORICAL_PALETTE = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
];
const OTHER_COLOR = "#8a8a86";

const trendChartData = computed(() => {
  const inPalette = trendSeries.value.slice(0, CATEGORICAL_PALETTE.length);
  const overflow = trendSeries.value.slice(CATEGORICAL_PALETTE.length);

  const datasets = inPalette.map((s, i) => ({
    label: s.nom,
    data: s.counts,
    borderColor: CATEGORICAL_PALETTE[i],
    backgroundColor: CATEGORICAL_PALETTE[i],
    borderWidth: 2,
    pointRadius: 3,
    tension: 0.2,
  }));

  // Au-delà de 8 flux, on regroupe le reste plutôt que de générer une teinte de plus.
  if (overflow.length) {
    datasets.push({
      label: "Autres",
      data: periods.value.map((_, i) =>
        overflow.reduce((sum, s) => sum + (s.counts[i] ?? 0), 0)
      ),
      borderColor: OTHER_COLOR,
      backgroundColor: OTHER_COLOR,
      borderWidth: 2,
      pointRadius: 3,
      tension: 0.2,
    });
  }

  return {
    labels: periods.value.map((p) => p.label),
    datasets,
  };
});

const trendChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "bottom" as const },
  },
  scales: {
    x: { grid: { display: false } },
    y: {
      beginAtZero: true,
      ticks: { precision: 0 },
      grid: { color: "#e5e7eb" },
    },
  },
};

const page = ref(1);
const noSearch = ref("");
const noFilters = ref<AdvancedFilters>({});
const { documents, isFetching, isError, error } = useDocuments(
  entiteId,
  ref(null),
  page,
  noSearch,
  ref(5),
  noFilters
);

const entiteName = computed(() => documents.value[0]?.denomination ?? null);

// Même pattern que DocumentList.vue::openDoc : on seed le cache pour éviter un flash
// vide le temps que la page détail recharge.
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
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-xl font-semibold text-gray-900">Tableau de bord</h1>
      <p v-if="entiteName" class="text-sm text-gray-500">{{ entiteName }}</p>
    </div>

    <div v-if="!entiteId" class="text-gray-500 italic">
      Sélectionnez une entité pour afficher le tableau de bord.
    </div>

    <template v-else>
      <section
        class="bg-white border border-gray-200 rounded-lg overflow-hidden"
      >
        <h2
          class="px-4 py-3 border-b border-gray-100 font-medium text-gray-900"
        >
          Tableau de bord général
        </h2>

        <div v-if="isError" class="text-red-600 p-4">{{ error?.message }}</div>

        <div v-else-if="isFetching && !documents.length" class="p-4">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200 text-left">
                <th class="px-3 py-2">
                  <Skeleton width="4rem" height="0.75rem" />
                </th>
                <th class="px-3 py-2 hidden sm:table-cell">
                  <Skeleton width="3rem" height="0.75rem" />
                </th>
                <th class="px-3 py-2">
                  <Skeleton width="3rem" height="0.75rem" />
                </th>
                <th class="px-3 py-2">
                  <Skeleton width="7rem" height="0.75rem" />
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="i in 5"
                :key="i"
                class="border-b border-gray-100 last:border-0"
              >
                <td class="px-3 py-3">
                  <Skeleton
                    :width="`${55 + ((i * 13) % 30)}%`"
                    height="0.75rem"
                  />
                </td>
                <td class="px-3 py-3 hidden sm:table-cell">
                  <Skeleton width="7rem" height="0.75rem" />
                </td>
                <td class="px-3 py-3">
                  <Skeleton width="8rem" height="0.75rem" />
                </td>
                <td class="px-3 py-3">
                  <Skeleton
                    width="5rem"
                    height="1.25rem"
                    border-radius="9999px"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <DataTable
          v-else
          :value="documents"
          striped-rows
          class="text-sm"
          :class="{ 'opacity-60 pointer-events-none': isFetching }"
        >
          <template #empty>
            <div class="text-center py-8 text-gray-400 italic">
              Aucun document
            </div>
          </template>

          <Column field="titre" header="Objet">
            <template #body="{ data: doc }">
              <button
                v-if="doc.titre"
                class="text-blue-600 hover:underline text-left"
                @click="openDoc(doc)"
              >
                {{ doc.titre }}
              </button>
              <span v-else class="italic text-gray-400">Non renseigné</span>
              <i
                v-if="isWithinDays(doc.creation, 7)"
                v-tooltip.top="'Créé il y a moins de 7 jours'"
                class="pi pi-sparkles text-amber-500 text-xs ml-2"
              />
              <i
                v-if="doc.action_possible?.length"
                v-tooltip.top="'Une action est possible sur ce document'"
                class="pi pi-exclamation-circle text-blue-500 text-xs ml-2"
              />
            </template>
          </Column>

          <Column
            header="Type"
            header-class="hidden sm:table-cell"
            body-class="hidden sm:table-cell"
          >
            <template #body="{ data: doc }">
              {{ fluxNameById[doc.type] ?? doc.type }}
            </template>
          </Column>

          <Column field="last_action_date" header="Date">
            <template #body="{ data: doc }">
              <span class="tabular-nums">{{
                formatDate(doc.last_action_date)
              }}</span>
            </template>
          </Column>

          <Column header="Etat retour TDT">
            <template #body="{ data: doc }">
              <Tag
                :severity="tdtStatus(doc).severity"
                :value="tdtStatus(doc).label"
              />
            </template>
          </Column>
        </DataTable>

        <div class="px-4 py-2 text-right border-t border-gray-100">
          <NuxtLink
            to="/documents"
            class="text-sm text-blue-600 hover:underline"
          >
            Voir tous les documents →
          </NuxtLink>
        </div>
      </section>

      <!-- Répartition par flux (noms réels renvoyés par Pastell, pas de catégorie inventée) -->
      <section class="bg-white border border-gray-200 rounded-lg p-4">
        <div class="flex items-baseline justify-between mb-3">
          <h2 class="font-medium text-gray-900">
            Répartition par type de flux
          </h2>
          <div class="text-right">
            <span class="text-2xl font-semibold text-gray-900">{{
              total
            }}</span>
            <span class="text-xs text-gray-500 uppercase tracking-wide ml-1"
              >actes au total</span
            >
          </div>
        </div>
        <div v-if="fluxCounts.length" class="h-64 overflow-x-auto">
          <div
            :style="{ minWidth: `${fluxCounts.length * 90}px`, height: '100%' }"
          >
            <Chart
              type="bar"
              :data="chartData"
              :options="chartOptions"
              class="h-full"
            />
          </div>
        </div>
        <div v-else-if="fluxStatsLoading" class="h-64">
          <Skeleton height="100%" />
        </div>
        <p v-else class="text-sm text-gray-400 italic">Aucun flux à afficher</p>
      </section>

      <!-- Évolution dans le temps : documents créés par mois et par flux (approximation à
           partir de `creation`, Pastell ne fournit pas d'historique d'état). -->
      <section class="bg-white border border-gray-200 rounded-lg p-4">
        <h2 class="font-medium text-gray-900 mb-1 flex items-center gap-1.5">
          Évolution par type d'acte
          <i
            v-tooltip.top="
              'Sur un flux à fort volume, les données les plus anciennes de la période peuvent être incomplètes (on ne charge que les 100 actes les plus récents par flux, pour ne pas ralentir la page).'
            "
            class="pi pi-info-circle text-gray-400 text-xs cursor-help"
          />
        </h2>
        <p class="text-xs text-gray-400 mb-3">
          Nombre d'actes créés par mois, sur les {{ periods.length }} derniers
          mois.
        </p>
        <div v-if="trendSeries.length" class="h-72">
          <Chart
            type="line"
            :data="trendChartData"
            :options="trendChartOptions"
            class="h-full"
          />
        </div>
        <div v-else-if="fluxStatsLoading" class="h-72">
          <Skeleton height="100%" />
        </div>
        <p v-else class="text-sm text-gray-400 italic">Aucun flux à afficher</p>
      </section>
    </template>
  </div>
</template>
