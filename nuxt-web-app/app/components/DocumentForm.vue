<script setup lang="ts">
const props = defineProps<{ idD: string; fluxType?: string }>();

const router = useRouter();
const entiteId = useSelectedEntiteId();

const formProps = reactive({
  entiteId,
  idD: computed(() => props.idD),
  fluxType: computed(() => props.fluxType),
});

const editState = useDocumentEdit(formProps);
const {
  doc,
  isPending,
  isNew,
  fluxDef,
  tabs,
  activeTab,
  tabFields,
  formData,
  pendingFiles,
  onFileChange,
  removeFile,
  fetchWithRefresh,
  externalDataLoading,
  showExternalDialog,
  externalDialogLabel,
  externalDialogSearch,
  externalDialogTemp,
  filteredExternalOptions,
  showTypePieceDialog,
  typePieceTypesList,
  typePieceItems,
  openExternalDialog,
  confirmTypePieceSelection,
  toggleExternalOption,
  externalDisplayValue,
} = editState;

// Sauvegarde
const { save, saving, saveError } = useDocumentSave(
  formProps,
  editState,
  fetchWithRefresh
);

// Raccord de l'affichage d'erreurs pour les dialogs externes
function handleOpenExternal(key: string, label: string) {
  openExternalDialog(key, label, (msg) => {
    saveError.value = msg;
  });
}
</script>

<template>
  <div class="max-w-8xl mx-auto px-4 py-6">
    <button
      class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      @click="router.back()"
    >
      <i class="pi pi-arrow-left text-xs" />
      Retour
    </button>

    <div v-if="isPending && !isNew" class="space-y-4">
      <Skeleton v-for="i in 6" :key="i" height="3rem" />
    </div>

    <template v-else>
      <div
        v-if="saveError"
        class="mb-4 text-sm text-red-700 bg-red-50 px-4 py-3 rounded border border-red-300"
      >
        {{ saveError }}
      </div>

      <h1 class="text-2xl font-bold text-gray-900 mb-6">
        {{
          isNew
            ? "Nouveau document"
            : (doc?.info?.titre ?? "Éditer le document")
        }}
      </h1>

      <!-- Onglets -->
      <div class="border-b border-gray-200 mb-0">
        <nav class="flex gap-0">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="
              activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
            "
            class="px-6 py-3 text-sm transition-colors -mb-px"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- Skeleton flux pas encore chargé -->
      <div
        v-if="!Object.keys(fluxDef).length"
        class="border border-t-0 border-gray-200 rounded-b-lg divide-y divide-gray-100"
      >
        <div v-for="i in 5" :key="i" class="flex px-4 py-3 even:bg-gray-50">
          <Skeleton width="33%" height="0.75rem" />
          <Skeleton width="50%" height="0.75rem" class="ml-8" />
        </div>
      </div>

      <!-- Champs -->
      <div
        v-else
        class="border border-t-0 border-gray-200 rounded-b-lg rounded-tr-lg overflow-hidden"
      >
        <table class="min-w-full text-sm">
          <tbody class="divide-y divide-gray-100">
            <tr v-if="tabFields.length === 0">
              <td
                colspan="2"
                class="px-4 py-6 text-center text-gray-400 italic"
              >
                Aucun champ disponible
              </td>
            </tr>
            <FormFieldRenderer
              v-for="field in tabFields"
              :key="field!.key"
              v-model="formData[field!.key]"
              :field="field!"
              :pending-files="pendingFiles[field!.key]"
              :external-display-value="externalDisplayValue(field!.key)"
              :external-data-loading="externalDataLoading === field!.key"
              @file-change="(e) => onFileChange(field!.key, e)"
              @file-remove="(f) => removeFile(field!.key, f)"
              @open-external="(key, label) => handleOpenExternal(key, label)"
            />
          </tbody>
        </table>
      </div>

      <div class="mt-6">
        <Button
          :label="saving ? 'Enregistrement...' : 'Enregistrer'"
          icon="pi pi-save"
          :loading="saving"
          @click="save"
        />
      </div>
    </template>

    <!-- Dialog externalData (classification, sélection unique) -->
    <Dialog
      v-model:visible="showExternalDialog"
      :header="`Sélectionner — ${externalDialogLabel}`"
      modal
      :style="{ width: 'min(90vw, 900px)' }"
    >
      <div class="mb-3">
        <input
          v-model="externalDialogSearch"
          type="text"
          placeholder="Rechercher..."
          class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          autofocus
        />
      </div>

      <div
        class="max-h-96 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded"
      >
        <div
          v-if="!filteredExternalOptions.length"
          class="px-3 py-4 text-center text-gray-400 italic text-sm"
        >
          Aucun résultat
        </div>
        <template v-for="opt in filteredExternalOptions" :key="opt">
          <!-- En-tête de groupe : non cliquable -->
          <div
            v-if="isExternalOptionHeader(opt)"
            class="w-full text-left px-3 py-2 text-sm font-semibold text-gray-500 bg-gray-50 select-none"
          >
            {{ opt }}
          </div>
          <!-- Item sélectionnable -->
          <button
            v-else
            type="button"
            class="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center gap-2 transition-colors"
            :class="
              externalDialogTemp.includes(opt)
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-700'
            "
            @click="toggleExternalOption(opt)"
          >
            <i
              v-if="externalDialogTemp.includes(opt)"
              class="pi pi-check text-blue-600"
            />
            {{ opt }}
          </button>
        </template>
      </div>
    </Dialog>

    <!-- Dialog type_piece : sélection par pièce -->
    <Dialog
      v-model:visible="showTypePieceDialog"
      header="Choix des types de pièces"
      modal
      :style="{ width: 'min(90vw, 1100px)' }"
    >
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-xs text-gray-500 border-b border-gray-200">
            <th class="pb-2 pr-6 font-medium">Pièce</th>
            <th class="pb-2 pr-6 font-medium">Nom du fichier</th>
            <th class="pb-2 font-medium">Type de pièce</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="(item, i) in typePieceItems" :key="i">
            <td class="py-3 pr-6 text-gray-600 whitespace-nowrap">
              {{ i === 0 ? "Pièce principale" : `Annexe numéro ${i}` }}
            </td>
            <td class="py-3 pr-6 text-gray-400 text-xs">{{ item.piece }}</td>
            <td class="py-3">
              <select
                v-model="item.label"
                class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Sélectionner —</option>
                <option
                  v-for="(label, code) in typePieceTypesList"
                  :key="code"
                  :value="label"
                >
                  {{ label }}
                </option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
      <template #footer>
        <Button
          label="Annuler"
          severity="secondary"
          @click="showTypePieceDialog = false"
        />
        <Button
          label="Valider"
          :disabled="typePieceItems.some((item) => !item.label)"
          @click="confirmTypePieceSelection"
        />
      </template>
    </Dialog>
  </div>
</template>
