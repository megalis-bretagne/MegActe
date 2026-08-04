<script setup lang="ts">
const selectedFlux = useSelectedFlux();
const entiteId = useSelectedEntiteId();

const { data: fluxList } = await useFetch("/api/user/flux");

const fluxItems = computed(() => {
  return Object.entries(fluxList.value ?? {})
    .map(([id, f]: [string, Flux]) => ({ id, nom: f.nom ?? id }))
    .sort((a, b) => a.nom.localeCompare(b.nom));
});

async function createDoc(flux: { id: string }) {
  if (!entiteId.value) return;
  selectedFlux.value = flux.id;
  await navigateTo(`/org/${entiteId.value}/document/new/edit?type=${flux.id}`);
}
</script>

<template>
  <aside class="w-64 shrink-0 bg-white border-r border-gray-200 min-h-screen">
    <!-- Tous les documents -->
    <div class="p-3 border-b border-gray-100">
      <button
        :class="
          !selectedFlux
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        "
        class="w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors"
        @click="selectedFlux = null"
      >
        Tous les documents
      </button>
    </div>

    <!-- Types de dossiers -->
    <div class="p-3">
      <h2
        class="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 mb-2"
      >
        Types de dossiers
      </h2>

      <div v-if="!fluxItems.length" class="space-y-1 px-3">
        <Skeleton v-for="i in 5" :key="i" height="2rem" />
      </div>

      <ul v-else class="space-y-0.5">
        <li
          v-for="flux in fluxItems"
          :key="flux.id"
          class="flex items-center gap-1"
        >
          <button
            :class="
              selectedFlux === flux.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            "
            class="flex-1 min-w-0 text-left px-3 py-2 rounded text-sm transition-colors truncate"
            @click="selectedFlux = flux.id"
          >
            {{ flux.nom }}
          </button>
          <button
            v-if="entiteId"
            v-tooltip.top="`Créer un document ${flux.nom}`"
            class="shrink-0 p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
            @click="createDoc(flux)"
          >
            <i class="pi pi-plus text-xs" />
          </button>
        </li>
      </ul>
    </div>
  </aside>
</template>
