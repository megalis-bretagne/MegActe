<script setup lang="ts">
const { data: version } = await useFetch<string>("/api/version");
</script>

<template>
  <footer
    class="flex shrink-0 items-center justify-between border-t border-gray-200 bg-white px-6 py-3 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
  >
    <span>MegActes est développé par Megalis Bretagne</span>
    <strong class="font-semibold">Version: {{ version ?? "-" }}</strong>
  </footer>
</template>
