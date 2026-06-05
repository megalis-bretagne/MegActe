<script setup lang="ts">
const route = useRoute();
const entiteId = Number(route.params.entiteId);
const idD = route.params.idD as string;
</script>

<template>
  <div class="p-6">
    <DocumentDetail :entite-id="entiteId" :id-d="idD" />
  </div>
</template>