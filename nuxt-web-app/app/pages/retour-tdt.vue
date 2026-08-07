<script setup lang="ts">
const route = useRoute();
const entiteId = useSelectedEntiteId();
const apiFetch = useApiFetch();

// Laisse le temps à S2low/Pastell de finaliser la transaction avant de rappeler
// verif-tdt, sinon le document reste "en attente du certificat RGS" jusqu'à ce que
// l'utilisateur pense à cliquer manuellement sur "Vérifier le statut de la transaction".
const VERIF_TDT_DELAY_MS = 5000;

const idE = computed(() => Number(route.query.id_e));

// Un seul document : id_d=X (cf. tdtReturnForOneDoc). Plusieurs : id_d[]=X&id_d[]=Y
// (cf. tdtReturnForManyDocs), Vue Router expose alors la clé littérale "id_d[]".
const singleIdD = computed(() => (route.query.id_d as string) || null);
const multipleIdD = computed(() => {
  const raw = route.query["id_d[]"];
  if (!raw) return [];
  return Array.isArray(raw) ? (raw as string[]) : [raw as string];
});

const errorCode = computed(() => Number(route.query.error ?? 0));
const message = computed(() => (route.query.message as string) ?? "");
const hasError = computed(() => errorCode.value >= 1);

// S2low ne renvoie pas d'erreur/message pour un envoi groupé (cf. doc API S2low, §4.17) : impossible
// de savoir ici si la transmission de chaque document a réussi, il faut vérifier dans la liste/journal.
const isMultiple = computed(() => multipleIdD.value.length > 0);

if (idE.value) entiteId.value = idE.value;

// Ne se lance que côté client (au montage) : la relance de verif-tdt ne doit se
// produire qu'une fois, pas pendant le rendu SSR.
onMounted(() => {
  if (hasError.value) return;
  const documentIds = singleIdD.value ?? multipleIdD.value;
  if (!idE.value || (Array.isArray(documentIds) ? documentIds.length === 0 : !documentIds)) return;

  setTimeout(async () => {
    try {
      await apiFetch(`/entite/${idE.value}/documents/perform_action`, {
        method: "POST",
        body: { document_ids: documentIds, action: "verif-tdt" },
      });
    } catch {
      // Best-effort : en cas d'échec le document reste "en attente" et l'utilisateur
      // peut relancer la vérification manuellement depuis sa fiche.
    }
  }, VERIF_TDT_DELAY_MS);
});

function backToDocuments() {
  if (singleIdD.value) {
    navigateTo(`/org/${idE.value}/document/${singleIdD.value}`);
  } else {
    navigateTo("/");
  }
}
</script>

<template>
  <div class="max-w-xl mx-auto py-16 text-center">
    <template v-if="hasError">
      <i class="pi pi-times-circle text-5xl text-red-500 mb-4 block" />
      <h1 class="text-xl font-semibold text-gray-900 mb-2">Erreur lors de la transmission</h1>
      <p v-if="message" class="text-sm text-gray-600 mb-6">Message de la préfecture : {{ message }}</p>
    </template>
    <template v-else-if="isMultiple">
      <i class="pi pi-info-circle text-5xl text-blue-500 mb-4 block" />
      <h1 class="text-xl font-semibold text-gray-900 mb-2">
        Transmission de {{ multipleIdD.length }} document{{ multipleIdD.length > 1 ? "s" : "" }} lancée.
      </h1>
      <p class="text-sm text-gray-600 mb-6">
        S2low ne renvoie pas de statut détaillé pour un envoi groupé : vérifiez le résultat de chaque document dans son journal.
      </p>
    </template>
    <template v-else>
      <i class="pi pi-check-circle text-5xl text-green-500 mb-4 block" />
      <h1 class="text-xl font-semibold text-gray-900 mb-2">Transmission effectuée.</h1>
      <p v-if="singleIdD" class="text-sm text-gray-500 mb-6">Document : {{ singleIdD }}</p>
    </template>

    <Button label="Revenir aux documents" class="mt-4" @click="backToDocuments" />
  </div>
</template>
