<script setup lang="ts">
const { user, selectedEntiteId } = useUserContext();

type EntiteNode = {
  id_e: number;
  denomination: string;
  child: EntiteNode[];
};

const racine = computed<EntiteNode | null>(() => user.value?.pastellUser?.entites?.[0] ?? null);
const filles = computed(() => racine.value?.child ?? []);

const selectedChild = ref<EntiteNode | null>(null);

// Dès que la racine est disponible (ou change), on reset la sélection des filles à null
// et on pose l'id actif sur la racine par défaut
watch(racine, (r) => {
  selectedChild.value = null;
  if (r) selectedEntiteId.value = r.id_e;
}, { immediate: true });

// Choix d'une fille -> id actif = id de la fille, sinon on revient à la racine
watch(selectedChild, (child) => {
  selectedEntiteId.value = child ? child.id_e : (racine.value?.id_e ?? null);
});

</script>

<template>
  <div class="flex items-center gap-2">
    <template v-if="racine">
      <span class="text-sm font-medium text-gray-900">{{ racine.denomination }}</span>

      <template v-if="filles.length">
        <span class="text-gray-400 font-light text-lg">/</span>
        <Select
            v-model="selectedChild"
            :options="filles"
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