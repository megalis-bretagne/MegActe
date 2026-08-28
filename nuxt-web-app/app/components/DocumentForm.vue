<script setup lang="ts">
const props = defineProps<{ idD: string; fluxType?: string }>();

const router = useRouter();
const entiteId = useSelectedEntiteId();

const formProps = reactive({
  entiteId,
  idD: computed(() => props.idD),
  fluxType: computed(() => props.fluxType),
});

const editState = await useDocumentEdit(formProps);
const {
  doc,
  isPending,
  isNew,
  fluxDef,
  hasStepTdt,
  currentStep,
  sections,
  formData,
  pendingFiles,
  fileError,
  onFileChange,
  removeFile,
  externalDataLoading,
  showExternalDialog,
  externalDialogLabel,
  externalDialogSearch,
  externalDialogTemp,
  filteredExternalOptions,
  typePieceTypesList,
  typePieceItems,
  typePieceLoading,
  openExternalDialog,
  toggleExternalOption,
  externalDisplayValue,
} = editState;

const {
  save,
  sendActe,
  saveTypePiece,
  saving,
  saveError,
  savingStep1,
  savingTypePiece,
  sending,
} = useDocumentSave(formProps, editState);

// Id du document déjà créé (pour télécharger les fichiers déjà enregistrés) : celui qu'on
// vient de créer en session, sinon celui de l'URL si ce n'est pas une création ("new")
const effectiveDocId = computed(
  () => editState.createdDocId.value ?? (!isNew.value ? props.idD : null)
);

// Raccord de l'affichage d'erreurs pour les dialogs externes
function handleOpenExternal(key: string, label: string) {
  openExternalDialog(key, label, (msg) => {
    saveError.value = msg;
  });
}

// Affichées à part (largeur naturelle) : en grille 2 colonnes, un nombre impair de checkboxes
// en isole une seule sur sa ligne.
const checkboxFields = (fields: FieldEdit[]) =>
  fields.filter((f) => f.type === "checkbox");
const otherFields = (fields: FieldEdit[]) =>
  fields.filter((f) => f.type !== "checkbox");
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
      <Skeleton width="66%" height="2rem" />
      <Skeleton width="25%" height="1rem" />
      <div class="flex gap-4 mt-2">
        <Skeleton width="8rem" height="0.75rem" />
        <Skeleton width="8rem" height="0.75rem" />
      </div>
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

    <template v-else>
      <div
        v-if="saveError"
        class="mb-4 text-sm text-red-700 bg-red-50 px-4 py-3 rounded border border-red-300"
      >
        {{ saveError }}
      </div>

      <div
        v-if="fileError"
        class="mb-4 text-sm text-red-700 bg-red-50 px-4 py-3 rounded border border-red-300"
      >
        {{ fileError }}
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
        <li
          class="flex items-center"
          :class="
            currentStep === 1 ? 'text-blue-600 font-medium' : 'text-gray-500'
          "
        >
          <span
            class="flex items-center justify-center w-6 h-6 mr-2 text-xs border rounded-full shrink-0"
            :class="currentStep === 1 ? 'border-blue-600' : 'border-gray-400'"
            >1</span
          >
          Préparation de l'acte
          <i class="pi pi-angle-right mx-3 text-gray-400" />
        </li>
        <li
          class="flex items-center"
          :class="
            currentStep === 2 ? 'text-blue-600 font-medium' : 'text-gray-500'
          "
        >
          <span
            class="flex items-center justify-center w-6 h-6 mr-2 text-xs border rounded-full shrink-0"
            :class="currentStep === 2 ? 'border-blue-600' : 'border-gray-400'"
            >2</span
          >
          Envoyer l'acte
        </li>
      </ol>

      <template v-if="!hasStepTdt || currentStep === 1">
        <div v-if="!Object.keys(fluxDef).length" class="space-y-8">
          <div v-for="i in 2" :key="i" class="space-y-4">
            <Skeleton width="10rem" height="1rem" />
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              <div v-for="j in 4" :key="j">
                <Skeleton width="40%" height="0.75rem" class="mb-2" />
                <Skeleton width="100%" height="2.5rem" border-radius="6px" />
              </div>
            </div>
          </div>
        </div>

        <!-- Sections (une par onglet du flux, toutes affichées à la suite) -->
        <div v-else class="space-y-8">
          <section v-for="section in sections" :key="section.id">
            <h2
              class="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200"
            >
              {{ section.label }}
            </h2>
            <p
              v-if="section.fields.length === 0"
              class="text-sm text-gray-400 italic"
            >
              Aucun champ disponible
            </p>
            <template v-else>
              <div
                v-if="checkboxFields(section.fields).length"
                class="flex flex-wrap gap-x-10 gap-y-4 mb-5"
              >
                <FormFieldRenderer
                  v-for="field in checkboxFields(section.fields)"
                  :key="field!.key"
                  v-model="formData[field!.key]"
                  :field="field!"
                  :entite-id="formProps.entiteId"
                  :id-d="effectiveDocId"
                />
              </div>
              <div
                v-if="otherFields(section.fields).length"
                class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5"
              >
                <FormFieldRenderer
                  v-for="field in otherFields(section.fields)"
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
                  @open-external="
                    (key, label) => handleOpenExternal(key, label)
                  "
                />
              </div>
            </template>
          </section>
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

      <template v-else>
        <h3 class="text-lg font-semibold mb-4">Choix des types de pièces</h3>

        <div
          v-if="typePieceLoading"
          class="border border-gray-200 rounded-lg divide-y divide-gray-100"
        >
          <div v-for="i in 3" :key="i" class="flex px-4 py-3 even:bg-gray-50">
            <Skeleton width="33%" height="0.75rem" />
            <Skeleton width="50%" height="0.75rem" class="ml-8" />
          </div>
        </div>

        <table
          v-else
          class="w-full text-sm border border-gray-200 rounded-lg overflow-hidden"
        >
          <thead>
            <tr
              class="text-left text-xs text-gray-500 border-b border-gray-200 bg-gray-50"
            >
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
