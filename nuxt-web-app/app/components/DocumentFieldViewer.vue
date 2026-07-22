<script setup lang="ts">
const props = defineProps<{
  field: any;
  entiteId: number;
  idD: string;
}>();

function downloadFile(filename: string, elementId: string) {
  const url = `/api/file/${props.entiteId}/${props.idD}/${elementId}/${encodeURIComponent(filename)}`;
  const a = window.document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

const isFileArray = (val: any) =>
    Array.isArray(val) &&
    val.length > 0 &&
    typeof val[0] === "string" &&
    val[0].includes(".");

const resolveSelectValue = (field: any) => {
  if (!field.selectValues) return field.val;
  return field.selectValues[field.val] ?? field.val;
};
</script>

<template>
  <!-- ged_document_id_file -->
  <template v-if="field.key === 'ged_document_id_file'">
    <table class="text-xs border border-gray-200 rounded">
      <thead>
      <tr class="bg-gray-50">
        <th
            class="px-3 py-1 text-left font-medium text-gray-600 border-b border-gray-200"
        >
          Nom du fichier
        </th>
        <th
            class="px-3 py-1 text-left font-medium text-gray-600 border-b border-gray-200"
        >
          Identifiant
        </th>
      </tr>
      </thead>
      <tbody>
      <tr
          v-for="(id, name) in field.val as Record<
              string,
              string
            >"
          :key="name"
          class="border-t border-gray-100"
      >
        <td class="px-3 py-1 text-gray-700">{{ name }}</td>
        <td class="px-3 py-1 text-gray-500">{{ id }}</td>
      </tr>
      </tbody>
    </table>
  </template>

  <!-- type_piece_fichier -->
  <template v-else-if="field.key === 'type_piece_fichier'">
    <div
        v-for="(piece, i) in field.val as any[]"
        :key="i"
        class="mb-1"
    >
      <button
          class="text-blue-600 hover:underline text-left"
          @click="downloadFile(piece.filename, 'arrete')"
      >
        {{ piece.filename }}
      </button>
      <span class="text-gray-400 ml-2 text-xs">{{
          piece.typologie
        }}</span>
    </div>
  </template>

  <!-- Fichiers -->
  <template
      v-else-if="
        field.key !== 'ged_document_id_file' &&
        (field.type === 'file' || isFileArray(field.val))
      "
  >
    <div
        v-for="(filename, i) in (Array.isArray(field.val)
          ? field.val
          : [field.val]) as string[]"
        :key="i"
        class="mb-1"
    >
      <button
          class="text-blue-600 hover:underline text-left"
          @click="downloadFile(filename, field.key)"
      >
        {{ filename }}
      </button>
    </div>
  </template>

  <!-- Select / Radios / Select2 -->
  <template v-else-if="field.selectValues">
    {{ resolveSelectValue(field) }}
  </template>

  <!-- Checkbox -->
  <template v-else-if="field.type === 'checkbox'">
    <input
        type="checkbox"
        :checked="
          field.val === 'checked' ||
          field.val === 'on' ||
          field.val === '1'
        "
        disabled
        class="w-4 h-4 accent-blue-600 cursor-default"
    />
  </template>

  <!-- Date -->
  <template
      v-else-if="
        typeof field.val === 'string' &&
        field.key !== 'date_cloture_journal_iso8601' &&
        /^\d{4}-\d{2}-\d{2}/.test(field.val)
      "
  >
    {{ new Date(field.val).toLocaleDateString("fr-FR") }}
  </template>

  <!-- URL -->
  <template
      v-else-if="
        typeof field.val === 'string' &&
        field.val.startsWith('http')
      "
  >
    <a
        :href="field.val"
        target="_blank"
        class="text-blue-600 hover:underline"
    >{{ field.val }}</a
    >
  </template>

  <!-- Texte multilignes -->
  <template
      v-else-if="
        typeof field.val === 'string' && field.val.includes('\n')
      "
  >
    <p class="whitespace-pre-line text-sm text-gray-600">
      {{ field.val }}
    </p>
  </template>

  <!-- Valeur simple -->
  <template v-else>
    {{
      Array.isArray(field.val)
          ? field.val.join(", ")
          : field.val
    }}
  </template>
</template>
