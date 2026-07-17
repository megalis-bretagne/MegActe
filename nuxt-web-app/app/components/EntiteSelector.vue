<script setup lang="ts">
const user = usePastellUser();
const selectedEntiteId = useSelectedEntiteId();

const rootEntity = computed<EntiteNode | null>(
  () => user.value?.entites?.[0] ?? null
);
const childrenEntities = computed(() => rootEntity.value?.child ?? []);
const selectedChild = ref<EntiteNode | null>(null);

// Dès que la rootEntity est disponible (ou change), on reset la sélection des childrenEntities à null
// et on pose l'id actif sur la rootEntity par défaut
watch(
  rootEntity,
  (r) => {
    selectedChild.value = null;
    if (r) selectedEntiteId.value = r.id_e;
  },
  { immediate: true }
);

// Choix d'une fille -> id actif = id de la fille, sinon on revient à la rootEntity
watch(selectedChild, (child) => {
  selectedEntiteId.value = child
    ? child.id_e
    : (rootEntity.value?.id_e ?? null);
});
</script>

<template>
  <div class="flex items-center gap-2">
    <template v-if="rootEntity">
      <span class="text-sm font-medium text-gray-900">{{
        rootEntity.denomination
      }}</span>

      <template v-if="childrenEntities.length">
        <span class="text-gray-400 font-light text-lg">/</span>
        <Select
          v-model="selectedChild"
          :options="childrenEntities"
          option-label="denomination"
          placeholder="Sélectionner une entité fille"
          show-clear
          class="text-sm"
          :pt="{ root: { style: 'min-width: max-content' } }"
        />
      </template>
    </template>

    <template v-else>
      <Skeleton width="10rem" height="2rem" border-radius="6px" />
      <span class="text-gray-300">/</span>
      <Skeleton width="14rem" height="2rem" border-radius="6px" />
    </template>
  </div>
</template>

