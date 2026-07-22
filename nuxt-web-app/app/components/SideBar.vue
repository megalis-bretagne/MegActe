<script setup lang="ts">
const config = useRuntimeConfig();
const { user, selectedFlux } = useUserContext();

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
    .map(([id, f]: [string, any]) => ({ id, nom: f.nom ?? id }))
    .sort((a, b) => a.nom.localeCompare(b.nom));
});

const rootMenuItems = computed(() => [
  {
    label: "Tous les documents",
    active: !selectedFlux.value,
    command: () => {
      selectedFlux.value = null;
    },
  },
]);

const fluxMenuItems = computed(() =>
  fluxItems.value.map((flux) => ({
    label: flux.nom,
    active: selectedFlux.value === flux.id,
    command: () => {
      selectedFlux.value = flux.id;
    },
  })),
);

const menuPt = {
  root: { class: "!border-0 !bg-transparent !min-w-0 !p-0 w-full" },
  list: { class: "!p-0 !gap-0.5" },
};
</script>
<template>
  <aside
    class="w-64 shrink-0 bg-white border-r border-gray-200 h-full overflow-y-auto"
  >
    <!-- Tous les documents -->
    <div class="p-3 border-b border-gray-100">
      <Menu :model="rootMenuItems" :pt="menuPt">
        <template #item="{ item, label }">
          <a
            tabindex="-1"
            class="block w-full px-3 py-2 rounded text-sm font-medium transition-colors cursor-pointer"
            :class="
              item.active
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            "
          >
            {{ label }}
          </a>
        </template>
      </Menu>
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

      <Menu v-else :model="fluxMenuItems" :pt="menuPt">
        <template #item="{ item, label }">
          <a
            tabindex="-1"
            class="block w-full px-3 py-2 rounded text-sm transition-colors cursor-pointer"
            :class="
              item.active
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            "
          >
            {{ label }}
          </a>
        </template>
      </Menu>
    </div>
  </aside>
</template>
