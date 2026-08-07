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
  doc, isPending, isNew, fluxDef, hasStepTdt, currentStep, tabs, activeTab, tabFields,
  formData, pendingFiles, onFileChange, removeFile,
  externalDataLoading, showExternalDialog, externalDialogLabel,
  externalDialogSearch, externalDialogTemp, filteredExternalOptions,
  typePieceTypesList, typePieceItems, typePieceLoading,
  openExternalDialog, toggleExternalOption,
  externalDisplayValue
} = editState;

// Sauvegarde
const { save, sendActe, saveTypePiece, saving, saveError, savingStep1, savingTypePiece, sending } = useDocumentSave(formProps, editState);

// Id du document déjà créé (pour télécharger les fichiers déjà enregistrés) : celui qu'on
// vient de créer en session, sinon celui de l'URL si ce n'est pas une création ("new")
const effectiveDocId = computed(() => editState.createdDocId.value ?? (!isNew.value ? props.idD : null));

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

      <!-- Cheminement (étapes), uniquement pour les flux avec télétransmission -->
      <ol v-if="hasStepTdt" class="flex items-center gap-2 mb-6 text-sm">
        <li class="flex items-center" :class="currentStep === 1 ? 'text-blue-600 font-medium' : 'text-gray-500'">
          <span
            class="flex items-center justify-center w-6 h-6 mr-2 text-xs border rounded-full shrink-0"
            :class="currentStep === 1 ? 'border-blue-600' : 'border-gray-400'"
          >1</span>
          Préparation de l'acte
          <i class="pi pi-angle-right mx-3 text-gray-400" />
        </li>
        <li class="flex items-center" :class="currentStep === 2 ? 'text-blue-600 font-medium' : 'text-gray-500'">
          <span
            class="flex items-center justify-center w-6 h-6 mr-2 text-xs border rounded-full shrink-0"
            :class="currentStep === 2 ? 'border-blue-600' : 'border-gray-400'"
          >2</span>
          Envoyer l'acte
        </li>
      </ol>

      <!-- Étape 1 : champs du flux -->
      <template v-if="!hasStepTdt || currentStep === 1">
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
                  :entite-id="formProps.entiteId"
                  :id-d="effectiveDocId"
                  @file-change="(e) => onFileChange(field!.key, e)"
                  @file-remove="(f) => removeFile(field!.key, f)"
                  @open-external="(key, label) => handleOpenExternal(key, label)"
              />
            </tbody>
          </table>
        </div>

        <div class="mt-6 flex gap-3">
          <template v-if="hasStepTdt">
            <Button
              :label="savingStep1 ? 'Chargement...' : 'Étape suivante'"
              icon="pi pi-arrow-right"
              icon-pos="right"
              :loading="savingStep1"
              :disabled="saving"
              @click="save"
            />
          </template>
          <template v-else>
            <Button
              :label="savingStep1 ? 'Enregistrement...' : 'Enregistrer'"
              icon="pi pi-save"
              severity="secondary"
              :loading="savingStep1"
              :disabled="saving"
              @click="save"
            />
            <Button
              :label="sending ? 'Enregistrement...' : 'Enregistrer et envoyer'"
              icon="pi pi-send"
              :loading="sending"
              :disabled="saving"
              @click="sendActe"
            />
          </template>
        </div>
      </template>

      <!-- Étape 2 : classification des pièces avant télétransmission -->
      <template v-else>
        <h3 class="text-lg font-semibold mb-4">Choix des types de pièces</h3>

        <div v-if="typePieceLoading" class="border border-gray-200 rounded-lg divide-y divide-gray-100">
          <div v-for="i in 3" :key="i" class="flex px-4 py-3 even:bg-gray-50">
            <Skeleton width="33%" height="0.75rem" />
            <Skeleton width="50%" height="0.75rem" class="ml-8" />
          </div>
        </div>

        <table v-else class="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
          <thead>
            <tr class="text-left text-xs text-gray-500 border-b border-gray-200 bg-gray-50">
              <th class="px-4 py-2 pr-6 font-medium">Pièce</th>
              <th class="px-4 py-2 pr-6 font-medium">Nom du fichier</th>
              <th class="px-4 py-2 font-medium">Type de pièce</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="(item, i) in typePieceItems" :key="i">
              <td class="px-4 py-3 text-gray-600 whitespace-nowrap">
                {{ i === 0 ? "Pièce principale" : `Annexe numéro ${i}` }}
              </td>
              <td class="px-4 py-3 text-gray-400 text-xs">{{ item.piece }}</td>
              <td class="px-4 py-3">
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

        <div class="mt-6 flex justify-between">
          <Button
            label="Précédent"
            icon="pi pi-arrow-left"
            severity="secondary"
            :disabled="saving"
            @click="currentStep = 1"
          />
          <div class="flex gap-3">
            <Button
              :label="savingTypePiece ? 'Enregistrement...' : 'Enregistrer'"
              icon="pi pi-save"
              severity="secondary"
              :loading="savingTypePiece"
              :disabled="saving"
              @click="saveTypePiece"
            />
            <Button
              :label="sending ? 'Envoi...' : `Envoyer l'acte`"
              icon="pi pi-send"
              :loading="sending"
              :disabled="saving"
              @click="sendActe"
            />
          </div>
        </div>
      </template>
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
  </div>
</template>
