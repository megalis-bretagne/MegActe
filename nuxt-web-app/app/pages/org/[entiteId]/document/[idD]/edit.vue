<script setup lang="ts">
const route = useRoute();
const idD = route.params.idD as string;
const fluxType = route.query.type as string | undefined;

useHead({
  title: idD === "new" ? "Nouveau document" : "Modifier le document",
});

// Resynchronise l'entité globale sur celle de l'URL : sinon le SSR peut fetcher le document
// d'une entité restée sélectionnée ailleurs (rechargement, lien direct...).
const entiteId = useSelectedEntiteId();
const urlEntiteId = Number(route.params.entiteId);
if (urlEntiteId && entiteId.value !== urlEntiteId) {
  entiteId.value = urlEntiteId;
}
</script>

<template>
  <div class="p-6">
    <DocumentForm :id-d="idD" :flux-type="fluxType" />
  </div>
</template>
