<script setup lang="ts">
const route = useRoute();
const idD = route.params.idD as string;
const fluxType = route.query.type as string | undefined;
</script>

<template>
  <div class="p-6">
    <ClientOnly>
      <DocumentForm :id-d="idD" :flux-type="fluxType" />
      <template #fallback>
        <div class="max-w-8xl mx-auto px-4 py-6 space-y-4">
          <Skeleton v-for="i in 6" :key="i" height="3rem" />
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
