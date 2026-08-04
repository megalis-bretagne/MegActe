<script setup lang="ts">
const props = defineProps<{
  field: FieldEdit;
  modelValue: string | string[];
  pendingFiles?: File[];
  externalDisplayValue?: string;
  externalDataLoading?: boolean;
}>();

const emit = defineEmits([
  "update:modelValue",
  "fileChange",
  "fileRemove",
  "openExternal",
]);

// Retour visuel immédiat pour numero_de_lacte / objet (contrôle bloquant à l'enregistrement dans useDocumentSave.ts)
const fieldError = computed(() => {
  if (props.field.key === "numero_de_lacte")
    return validateNumeroActe(props.modelValue);
  if (props.field.key === "objet") return validateObjet(props.modelValue);
  return null;
});
</script>

<template>
  <!-- Notice (champ sans label, ex: "comment") -->
  <tr v-if="field.label === '_'">
    <td
      colspan="2"
      class="px-4 py-3 text-xs text-amber-700 bg-amber-50 border-l-4 border-amber-400"
    >
      {{
        field.commentaire
          ? decodeHtmlEntities(field.commentaire)
          : field.commentaire
      }}
    </td>
  </tr>

  <tr v-else class="even:bg-gray-50">
    <!-- Label -->
    <td
      class="px-4 py-3 font-medium text-gray-600 w-1/3 align-top whitespace-nowrap"
    >
      {{ field.label }}
      <span v-if="field.required" class="text-red-500 ml-1">*</span>
      <span
        v-if="field.commentaire"
        class="block text-xs text-gray-400 font-normal max-w-xs whitespace-normal mt-0.5"
      >
        {{ decodeHtmlEntities(field.commentaire.replace(/<[^>]*>/g, "")) }}
      </span>
    </td>

    <!-- Contrôle -->
    <td class="px-4 py-3">
      <!-- Select -->
      <template v-if="field.type === 'select'">
        <select
          :value="modelValue"
          :disabled="field.readonly"
          class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          @change="
            emit(
              'update:modelValue',
              ($event.target as HTMLSelectElement).value
            )
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

      <!-- Fichier -->
      <template v-else-if="field.type === 'file'">
        <label
          class="inline-flex items-center gap-2 px-3 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 cursor-pointer w-fit"
        >
          <span
            >Choisir {{ field.multiple ? "des fichiers" : "un fichier" }}</span
          >
          <input
            type="file"
            :multiple="field.multiple"
            :accept="field.accept ?? undefined"
            class="sr-only"
            @change="emit('fileChange', $event)"
          />
        </label>

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
        <p v-else-if="modelValue?.length" class="mt-1 text-xs text-gray-400">
          Actuel :
          {{ Array.isArray(modelValue) ? modelValue.join(", ") : modelValue }}
        </p>
      </template>

      <!-- Checkbox -->
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

      <!-- Date -->
      <template v-else-if="field.type === 'date'">
        <input
          :value="modelValue"
          type="date"
          class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            class="text-sm text-gray-700 flex-1 min-w-0 break-words"
          >
            {{ externalDisplayValue }}
          </span>
          <span v-else class="text-sm text-gray-400 italic flex-1"
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

      <!-- Texte (fallback) -->
      <template v-else>
        <input
          :value="modelValue"
          type="text"
          :disabled="field.readonly"
          class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
    </td>
  </tr>
</template>
