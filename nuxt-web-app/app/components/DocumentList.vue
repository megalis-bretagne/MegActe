<script setup lang="ts">
const props = defineProps<{
  entiteId: number;
  idFlux?: string | null;
}>();

const { documents, isLoading, error, fetchDocuments } = useDocuments();

onMounted(() => {
  fetchDocuments(props.entiteId, props.idFlux ?? null);
});

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const stateLabel = (doc: any) => doc.last_action_message || doc.last_action || "—";
</script>

<template>
  <div class="container mx-auto">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-xl font-semibold text-gray-900">
        {{ idFlux ? `Liste des ${idFlux}` : "Liste des documents" }}
      </h1>
    </div>

    <div v-if="isLoading" class="flex items-center justify-center py-10 text-gray-500">
      <svg class="animate-spin w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      Chargement des documents en cours...
    </div>

    <div v-else-if="error" class="text-red-600 py-4">{{ error }}</div>

    <div v-else class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table class="min-w-full table-auto text-sm text-left text-gray-700">
        <thead class="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
        <tr>
          <th class="px-4 py-3">Objet</th>
          <th v-if="!idFlux" class="px-4 py-3 hidden sm:table-cell">Type</th>
          <th class="px-4 py-3">État</th>
          <th class="px-4 py-3 hidden sm:table-cell">Date de modification</th>
        </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 bg-white">
        <tr v-if="documents.length === 0">
          <td :colspan="idFlux ? 3 : 4" class="text-center py-6 text-gray-400 italic">Aucun document</td>
        </tr>
        <tr v-for="doc in documents" :key="doc.id_d" class="hover:bg-gray-50 transition-colors">
          <td class="px-4 py-3 whitespace-normal">
            <span v-if="doc.titre" class="font-medium">{{ doc.titre }}</span>
            <span v-else class="italic text-gray-400">Non renseigné</span>
          </td>
          <td v-if="!idFlux" class="px-4 py-3 hidden sm:table-cell text-gray-500">{{ doc.type }}</td>
          <td class="px-4 py-3">
              <span class="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                {{ stateLabel(doc) }}
              </span>
          </td>
          <td class="px-4 py-3 hidden sm:table-cell text-gray-500">{{ formatDate(doc.last_action_date) }}</td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>