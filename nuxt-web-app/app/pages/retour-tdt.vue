<script setup lang="ts">
useHead({ title: "Retour télétransmission" });

const route = useRoute();
const entiteId = useSelectedEntiteId();

const idE = computed(() => Number(route.query.id_e));

const singleIdD = computed(() => (route.query.id_d as string) || null);
const multipleIdD = computed(() => {
  const raw = route.query["id_d[]"];
  if (!raw) return [];
  return Array.isArray(raw) ? (raw as string[]) : [raw as string];
});

const errorCode = computed(() => Number(route.query.error ?? 0));
const message = computed(() => (route.query.message as string) ?? "");
const hasError = computed(() => errorCode.value >= 1);

// S2low ne renvoie pas d'erreur/message pour un envoi groupé (cf. doc API S2low,
// §4.17) : impossible de savoir ici si la transmission de chaque document a réussi,
// il faut vérifier dans la liste/journal.
const isMultiple = computed(() => multipleIdD.value.length > 0);

if (idE.value) entiteId.value = idE.value;

function backToDocuments() {
  if (singleIdD.value) {
    navigateTo(`/org/${idE.value}/document/${singleIdD.value}`);
  } else {
    navigateTo("/documents");
  }
}
</script>

<template>
  <div class="min-h-[70vh] flex items-center justify-center px-4">
    <div
      class="w-full max-w-sm bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center"
    >
      <template v-if="hasError">
        <div
          class="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center"
        >
          <i class="pi pi-times-circle text-2xl text-red-500" />
        </div>
        <h1 class="text-lg font-semibold text-gray-900 mb-2">
          Erreur lors de la transmission
        </h1>
        <p v-if="message" class="text-sm text-gray-500 mb-6">
          Message de la préfecture : {{ message }}
        </p>
      </template>
      <template v-else-if="isMultiple">
        <div
          class="w-14 h-14 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center"
        >
          <i class="pi pi-info-circle text-2xl text-blue-500" />
        </div>
        <h1 class="text-lg font-semibold text-gray-900 mb-2">
          Transmission de {{ multipleIdD.length }} document{{
            multipleIdD.length > 1 ? "s" : ""
          }}
          lancée
        </h1>
        <p class="text-sm text-gray-500 mb-6">
          S2low ne renvoie pas de statut détaillé pour un envoi groupé :
          vérifiez le résultat de chaque document dans son journal.
        </p>
      </template>
      <template v-else>
        <div
          class="w-14 h-14 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center"
        >
          <i class="pi pi-check-circle text-2xl text-green-500" />
        </div>
        <h1 class="text-lg font-semibold text-gray-900 mb-2">
          Transmission lancée
        </h1>
        <p v-if="singleIdD" class="text-xs text-gray-400 mb-3">
          Document : {{ singleIdD }}
        </p>
        <p class="text-sm text-gray-500 mb-6">
          Vérifiez le statut de la transaction depuis la fiche du document.
        </p>
      </template>

      <Button
        label="Revenir aux documents"
        class="w-full"
        @click="backToDocuments"
      />
    </div>
  </div>
</template>
