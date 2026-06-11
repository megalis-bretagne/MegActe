<script setup lang="ts">
const route = useRoute();
const entiteId = Number(route.params.entiteId);
const idD = route.params.idD as string;
</script>

<template>
  <div class="p-6">
    <ClientOnly>
      <DocumentDetail :entite-id="entiteId" :id-d="idD" />
    </ClientOnly>
  </div>
</template>
