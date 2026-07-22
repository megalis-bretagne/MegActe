<script setup lang="ts">
const route = useRoute();
const entiteId = Number(route.params.entiteId);
const idD = route.params.idD as string;
const fluxType = route.query.type as string | undefined;
</script>

<template>
  <div class="p-6">
    <ClientOnly>
      <DocumentDetail :entite-id="entiteId" :id-d="idD" :flux-type="fluxType" />
      <template #fallback>
        <div class="max-w-8xl mx-auto px-4 py-6 space-y-4">
          <Skeleton width="66%" height="2rem" />
          <Skeleton width="25%" height="1rem" />
          <div class="flex gap-2 mt-4">
            <Skeleton width="6rem" height="2.25rem" border-radius="6px" />
            <Skeleton width="6rem" height="2.25rem" border-radius="6px" />
          </div>
          <div class="border border-gray-200 rounded-lg overflow-hidden mt-6">
            <div v-for="i in 5" :key="i" class="flex px-4 py-3 even:bg-gray-50">
              <Skeleton width="33%" height="0.75rem" />
              <Skeleton width="50%" height="0.75rem" class="ml-8" />
            </div>
          </div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
