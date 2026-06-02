<script setup lang="ts">
const { user } = useUserContext();
const entiteId = computed(() => user.value?.pastell?.id_e ?? 1);
</script>

<template>
  <div class="p-6">
    <DocumentList :entite-id="entiteId" />
  </div>
</template>