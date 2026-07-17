<script setup lang="ts">
const selectedFlux = useSelectedFlux();

const { data: fluxList } = await useFetch("/api/user/flux");
console.log("fluxList: ", fluxList.value);

const fluxItems = computed(() => {
  return Object.entries(fluxList.value)
    .map(([id, f]: [string, any]) => ({ id, nom: f.nom ?? id }))
    .sort((a, b) => a.nom.localeCompare(b.nom));
});
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
        <li v-for="flux in fluxItems" :key="flux.id">
          <button
            :class="
              selectedFlux === flux.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            "
            class="w-full text-left px-3 py-2 rounded text-sm transition-colors"
            @click="selectedFlux = flux.id"
          >
            {{ flux.nom }}
          </button>
        </li>
      </ul>
    </div>
  </aside>
</template>
