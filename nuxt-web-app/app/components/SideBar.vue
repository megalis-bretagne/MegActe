<<<<<<< HEAD
<script setup lang="ts">
const props = defineProps<{
  entiteId?: number;
  selectedFlux?: string | null;
}>();

const emit = defineEmits<{ selectFlux: [flux: string | null] }>();

const config = useRuntimeConfig();
const { user } = useUserContext();

const fluxList = ref<Record<string, any>>({});

async function fetchFlux() {
  if (!user.value?.token) return;
  try {
    fluxList.value = await $fetch<Record<string, any>>("/flux", {
      baseURL: config.public.apiBaseUrl,
      headers: { Authorization: `Bearer ${user.value.token}` },
    });
  } catch {
    fluxList.value = {};
  }
}

watch(
  () => user.value?.token,
  (token) => {
    if (token) fetchFlux();
  },
  { immediate: true },
);

const fluxItems = computed(() => {
  return Object.entries(fluxList.value)
    .filter(([, f]) => f.enable !== false)
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
          selectedFlux === null || selectedFlux === undefined
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        "
        class="w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors"
        @click="emit('selectFlux', null)"
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
        <div
          v-for="i in 5"
          :key="i"
          class="h-8 bg-gray-100 rounded animate-pulse"
        />
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
            @click="emit('selectFlux', flux.id)"
          >
            {{ flux.nom }}
          </button>
        </li>
      </ul>
    </div>
  </aside>
</template>
