<script setup lang="ts">
const { selectedEntiteId } = useUserContext();
</script>

<template>
  <div class="p-6 h-full">
    <DocumentList :entite-id="selectedEntiteId" />
  </div>
</template>
