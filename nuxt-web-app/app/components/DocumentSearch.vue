<script setup lang="ts">
const modelValue = defineModel<string>({ default: "" });

// Débounce : search alimente la queryKey de useDocuments, sans lui chaque frappe déclenchait
// un fetch serveur (taper "acte" = 4 requêtes, 3 jetées).
const localValue = ref(modelValue.value);
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(localValue, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    modelValue.value = val;
  }, 350);
});

// Resynchronise l'input si la valeur change depuis l'extérieur (ex: reset ailleurs dans
// l'appli), sans attendre le débounce.
watch(modelValue, (val) => {
  if (val !== localValue.value) localValue.value = val;
});

function clear() {
  if (debounceTimer) clearTimeout(debounceTimer);
  localValue.value = "";
  modelValue.value = "";
}
</script>

<template>
  <div class="relative w-full max-w-sm">
    <svg
      class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
      />
    </svg>
    <input
      v-model="localValue"
      type="text"
      placeholder="Rechercher…"
      class="w-full pl-9 pr-8 py-1.5 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
    />
    <button
      v-if="localValue"
      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      @click="clear"
    >
      <svg
        class="h-4 w-4"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  </div>
</template>
