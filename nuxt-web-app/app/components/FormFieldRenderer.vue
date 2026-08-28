<script setup lang="ts">
const props = defineProps<{
  field: FieldEdit;
  modelValue?: string | string[];
  pendingFiles?: File[];
  externalDisplayValue?: string;
  externalDataLoading?: boolean;
  entiteId?: number | null;
  idD?: string | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  fileChange: [event: Event];
  fileRemove: [file: File];
  openExternal: [key: string, label: string];
}>();

// Retour visuel immédiat pour numero_de_lacte / objet (le contrôle bloquant à
// l'enregistrement est dans useDocumentSave.ts)
const fieldError = computed(() => {
  if (props.field.key === "numero_de_lacte")
    return validateNumeroActe(props.modelValue);
  if (props.field.key === "objet") return validateObjet(props.modelValue);
  return null;
});

// Fichier(s) déjà enregistré(s) pour ce champ (Pastell renvoie parfois un objet JSON à clés
// numériques plutôt qu'un tableau pour un champ multiple, ex: Annexes)
const savedFiles = computed(() => toFileList(props.modelValue));

const { downloadDocumentFile } = useFileDownload();
function downloadSavedFile(filename: string, index: number) {
  if (!props.entiteId || !props.idD) return;
  downloadDocumentFile(
    props.entiteId,
    props.idD,
    props.field.key,
    filename,
    index
  );
}

// Drag & drop : assigne .files à l'input caché puis déclenche "change" dessus, pour repasser
// par le même chemin qu'un choix via le picker natif au lieu de dupliquer onFileChange.
const fileInputRef = ref<HTMLInputElement>();
const isDragOver = ref(false);

function handleDrop(event: DragEvent) {
  isDragOver.value = false;
  const files = event.dataTransfer?.files;
  if (!files?.length || !fileInputRef.value) return;
  fileInputRef.value.files = files;
  fileInputRef.value.dispatchEvent(new Event("change", { bubbles: true }));
}
</script>

<template>
  <!-- Notice (champ sans label, ex: "comment") : pleine largeur -->
  <div
    v-if="field.label === '_'"
    class="sm:col-span-2 px-4 py-3 text-xs text-amber-700 bg-amber-50 border-l-4 border-amber-400 rounded"
  >
    {{
      field.commentaire
        ? decodeHtmlEntities(field.commentaire)
        : field.commentaire
    }}
  </div>

  <div v-else>
    <label class="block text-sm font-medium text-gray-700 mb-1">
      {{ field.label }}
      <span v-if="field.required" class="text-red-500 ml-1">*</span>
    </label>
    <p v-if="field.commentaire" class="text-xs text-gray-400 mb-1.5">
      {{ decodeHtmlEntities(field.commentaire.replace(/<[^>]*>/g, "")) }}
    </p>

    <template v-if="field.type === 'select'">
      <select
        :value="modelValue"
        :disabled="field.readonly"
        class="w-full border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        @change="
          emit('update:modelValue', ($event.target as HTMLSelectElement).value)
        "
      >
        <option value="">...</option>
        <option
          v-for="(label, val) in field.selectValues"
          :key="val"
          :value="val"
        >
          {{ label }}
        </option>
      </select>
    </template>

    <template v-else-if="field.type === 'file'">
      <div
        class="rounded border border-dashed px-3 py-3 transition-colors"
        :class="isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'"
        @dragover.prevent="isDragOver = true"
        @dragleave.prevent="isDragOver = false"
        @drop.prevent="handleDrop"
      >
        <label
          class="inline-flex items-center gap-2 px-3 py-1 text-base border border-gray-300 rounded bg-white hover:bg-gray-50 cursor-pointer w-fit"
        >
          <span
            >Choisir {{ field.multiple ? "des fichiers" : "un fichier" }}</span
          >
          <input
            ref="fileInputRef"
            type="file"
            :multiple="field.multiple"
            :accept="field.accept ?? undefined"
            class="sr-only"
            @change="emit('fileChange', $event)"
          />
        </label>
        <p class="text-xs text-gray-400 mt-1">
          ou glissez-déposez
          {{ field.multiple ? "vos fichiers" : "votre fichier" }} ici
        </p>

        <div v-if="pendingFiles?.length" class="mt-1 flex flex-wrap gap-1">
          <span
            v-for="f in pendingFiles"
            :key="f.name"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs"
          >
            {{ f.name }}
            <button
              type="button"
              class="hover:text-red-500"
              @click="emit('fileRemove', f)"
            >
              ×
            </button>
          </span>
        </div>
        <div v-else-if="savedFiles.length" class="mt-1 flex flex-wrap gap-x-2">
          <button
            v-for="(filename, i) in savedFiles"
            :key="filename"
            type="button"
            class="text-xs text-blue-600 hover:underline"
            @click="downloadSavedFile(filename, i)"
          >
            {{ filename }}
          </button>
        </div>
      </div>
    </template>

    <template v-else-if="field.type === 'checkbox'">
      <input
        type="checkbox"
        :checked="modelValue === 'checked' || modelValue === '1'"
        :disabled="field.readonly"
        class="w-4 h-4 accent-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        @change="
          emit(
            'update:modelValue',
            ($event.target as HTMLInputElement).checked ? 'checked' : ''
          )
        "
      />
    </template>

    <template v-else-if="field.type === 'date'">
      <input
        :value="modelValue"
        type="date"
        class="w-full border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        @input="
          emit('update:modelValue', ($event.target as HTMLInputElement).value)
        "
      />
    </template>

    <!-- ExternalData (classification, type_piece) -->
    <template v-else-if="field.type === 'externalData'">
      <div class="flex items-start gap-3">
        <span
          v-if="externalDisplayValue"
          class="text-base text-gray-700 flex-1 min-w-0 break-words"
        >
          {{ externalDisplayValue }}
        </span>
        <span v-else class="text-base text-gray-400 italic flex-1"
          >Non renseigné</span
        >
        <Button
          :label="externalDisplayValue ? 'Modifier' : 'Sélectionner'"
          icon="pi pi-list"
          severity="secondary"
          size="small"
          :loading="externalDataLoading"
          @click="emit('openExternal', field.key, field.label)"
        />
      </div>
    </template>

    <template v-else>
      <input
        :value="modelValue"
        type="text"
        :disabled="field.readonly"
        class="w-full border rounded px-3 py-2 text-base focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
        :class="
          fieldError
            ? 'border-red-400 focus:ring-red-400'
            : 'border-gray-300 focus:ring-blue-500'
        "
        @input="
          emit('update:modelValue', ($event.target as HTMLInputElement).value)
        "
      />
      <p v-if="fieldError" class="mt-1 text-xs text-red-600">
        {{ fieldError }}
      </p>
    </template>
  </div>
</template>
