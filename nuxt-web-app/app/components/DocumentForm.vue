<script setup lang="ts">
const props = defineProps<{
  entiteId: number;
  idD: string;
  fluxType?: string;
}>();

const config = useRuntimeConfig();
const router = useRouter();
const { user } = useUserContext();
const { getFluxDef } = useFluxDef();

const isNew = computed(() => props.idD === "new");
const createdDocId = ref<string | null>(null);

const headers = computed(() => ({
  Authorization: `Bearer ${user.value?.token}`,
}));

// ── Fetch document (edit only) ────────────────────────────────────────────
const { data: document, pending } = useAsyncData(
  `form-document-${props.entiteId}-${props.idD}`,
  async () => {
    if (isNew.value || !user.value?.token) return null;
    return await $fetch<any>(
      `/entite/${props.entiteId}/document/${props.idD}`,
      { baseURL: config.public.apiBaseUrl, headers: headers.value },
    );
  },
  { server: false, watch: [() => user.value?.token] },
);

// ── Flux def ──────────────────────────────────────────────────────────────
const fluxDef = ref<Record<string, any>>({});

watch(
  () => user.value?.token,
  async (token) => {
    const type = props.fluxType ?? document.value?.info?.type;
    if (!token || !type) return;
    fluxDef.value = await getFluxDef(type);
  },
  { immediate: true },
);

// ── Tabs par type de flux ─────────────────────────────────────────────────
// Note: on utilise type_piece (externalData, sélecteur) et non type_piece_fichier
// (fichiers liés) — les fichiers sont uploadés via arrete/autre_document_attache.
const STUDIO_FORM_TABS = [
  {
    id: "preparer",
    label: "Préparer",
    fields: ["acte_nature", "numero_de_lacte", "objet", "arrete", "autre_document_attache", "publication_open_data"],
  },
  {
    id: "cheminement",
    label: "Cheminement",
    fields: ["envoi_tdt_actes", "envoi_depot", "envoi_sae"],
  },
  {
    id: "acte",
    label: "Acte",
    fields: ["date_de_lacte", "document_papier", "classification", "type_piece"],
  },
];

const AUTRES_SANS_TDT_FORM_TABS = [
  {
    id: "preparer",
    label: "Préparer",
    fields: [
      "acte_nature", "nature_autre_detail", "numero_de_lacte", "objet",
      "date_de_lacte", "classification", "arrete", "autre_document_attache", "publication_open_data",
    ],
  },
  {
    id: "cheminement",
    label: "Cheminement",
    fields: ["envoi_depot", "envoi_sae"],
  },
];

const FORM_TABS_CONFIG: Record<string, typeof STUDIO_FORM_TABS> = {
  "deliberations-studio": STUDIO_FORM_TABS,
  "arretes-individuels-studio": STUDIO_FORM_TABS,
  "actes-reglementaires-studio": STUDIO_FORM_TABS,
  "autres-studio": STUDIO_FORM_TABS,
  "autres-studio-sans-tdt": AUTRES_SANS_TDT_FORM_TABS,
  "contrats-studio": STUDIO_FORM_TABS,
  "documents-budgetaires-studio": STUDIO_FORM_TABS,
};

const tabs = computed(() => {
  const type = props.fluxType ?? document.value?.info?.type;
  return FORM_TABS_CONFIG[type ?? ""] ?? STUDIO_FORM_TABS;
});

const activeTab = ref("preparer");

// ── Champs de l'onglet actif ──────────────────────────────────────────────
const tabFields = computed(() => {
  const tab = tabs.value.find((t) => t.id === activeTab.value);
  if (!tab) return [];
  return tab.fields
    .map((key) => {
      const def = fluxDef.value[key];
      if (!def) return null;
      if (def["no-show"]) return null;
      // Les champs edit-only sont conçus pour apparaître dans le formulaire
      // Les champs read-only sont affichés mais désactivés
      return {
        key,
        label: def.name ?? key.replace(/_/g, " "),
        type: def.type ?? "text",
        required: def.requis ?? false,
        multiple: def.multiple ?? false,
        selectValues: def.value ?? null,
        commentaire: def.commentaire ?? null,
        readonly: !!def["read-only"] || key === "acte_nature",
      };
    })
    .filter(Boolean);
});

// ── Valeurs par défaut pour les nouveaux documents (par flux) ─────────────
const FORM_DEFAULTS: Record<string, Record<string, any>> = {
  "arretes-individuels-studio": {
    envoi_tdt_actes: "checked",
    envoi_depot: "checked",
    envoi_sae: "checked",
  },
  "deliberations-studio": {
    envoi_tdt_actes: "checked",
    envoi_depot: "checked",
    envoi_sae: "checked",
  },
  "actes-reglementaires-studio": {
    envoi_tdt_actes: "checked",
    envoi_depot: "checked",
    envoi_sae: "checked",
  },
  "autres-studio": {
    envoi_tdt_actes: "checked",
    envoi_depot: "checked",
    envoi_sae: "checked",
  },
  "contrats-studio": {
    envoi_tdt_actes: "checked",
    envoi_depot: "checked",
    envoi_sae: "checked",
  },
  "documents-budgetaires-studio": {
    envoi_tdt_actes: "checked",
    envoi_depot: "checked",
    envoi_sae: "checked",
  },
};

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

// ── Données du formulaire ─────────────────────────────────────────────────
const formData = ref<Record<string, any>>({});

watch(document, (doc) => {
  if (doc?.data) formData.value = { ...doc.data };
}, { immediate: true });

// Pré-remplit les valeurs par défaut pour un nouveau document
watch(fluxDef, () => {
  if (!isNew.value) return;
  const type = props.fluxType ?? "";

  // acte_nature : première valeur de la liste
  if (!formData.value.acte_nature) {
    const options = fluxDef.value.acte_nature?.value as Record<string, string> | undefined;
    if (options) formData.value.acte_nature = Object.keys(options)[0];
  }

  // date_de_lacte : aujourd'hui
  if (!formData.value.date_de_lacte) {
    formData.value.date_de_lacte = todayISO();
  }

  // Valeurs par défaut propres au flux (cases à cocher cheminement, etc.)
  const defaults = FORM_DEFAULTS[type] ?? {};
  for (const [key, val] of Object.entries(defaults)) {
    if (!formData.value[key]) formData.value[key] = val;
  }
});

// ── Fichiers ──────────────────────────────────────────────────────────────
const pendingFiles = ref<Record<string, File[]>>({});

function onFileChange(key: string, event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;
  pendingFiles.value[key] = Array.from(input.files);
}

// ── ExternalData (classification, type_piece) ─────────────────────────────
const externalDataCache = ref<Record<string, Record<string, boolean>>>({});
const externalDataLoading = ref<string | null>(null);
const showExternalDialog = ref(false);
const externalDialogField = ref("");
const externalDialogLabel = ref("");
const externalDialogSearch = ref("");
const externalDialogMultiple = ref(false);
const externalDialogTemp = ref<string[]>([]);

const filteredExternalOptions = computed(() => {
  const vals = externalDataCache.value[externalDialogField.value] ?? {};
  const keys = Object.keys(vals);
  const q = externalDialogSearch.value.trim().toLowerCase();
  return q ? keys.filter((k) => k.toLowerCase().includes(q)) : keys;
});

// Retourne un id_d de référence pour les appels externalData.
// Pour un doc existant → son propre id_d.
// Pour un nouveau doc → on cherche d'abord un doc existant du même flux
// (les valeurs externalData sont identiques pour tous les docs du même type),
// et on ne crée un doc qu'en dernier recours (s'il n'en existe aucun).
const refDocId = ref<string | null>(null);

async function getRefDocId(): Promise<string> {
  if (!isNew.value) return props.idD;
  if (refDocId.value) return refDocId.value;

  const type = props.fluxType ?? "";
  try {
    const res = await $fetch<any>(`/entite/${props.entiteId}/documents`, {
      baseURL: config.public.apiBaseUrl,
      headers: headers.value,
      query: { type_flux: type, limit: 1, offset: 0 },
    });
    if (res?.documents?.length > 0) {
      refDocId.value = res.documents[0].id_d;
      return refDocId.value;
    }
  } catch {}

  // Aucun doc existant → création lazy
  return ensureDocExists();
}

async function ensureDocExists(): Promise<string> {
  if (!isNew.value) return props.idD;
  if (createdDocId.value) return createdDocId.value;
  const response = await $fetch<any>(`/entite/${props.entiteId}/document`, {
    method: "POST",
    baseURL: config.public.apiBaseUrl,
    headers: headers.value,
    body: { flux_type: props.fluxType, doc_info: {} },
  });
  createdDocId.value = response.info.id_d;
  return createdDocId.value;
}

async function openExternalDialog(fieldKey: string, fieldLabel: string) {
  externalDialogField.value = fieldKey;
  externalDialogLabel.value = fieldLabel;
  externalDialogSearch.value = "";
  externalDialogMultiple.value = fieldKey === "type_piece";

  const current = formData.value[fieldKey];
  externalDialogTemp.value = Array.isArray(current) ? [...current] : current ? [current] : [];

  if (!externalDataCache.value[fieldKey]) {
    externalDataLoading.value = fieldKey;
    try {
      const docId = await getRefDocId();
      const data = await $fetch<Record<string, boolean>>(
        `/entite/${props.entiteId}/document/${docId}/externalData/${fieldKey}`,
        { baseURL: config.public.apiBaseUrl, headers: headers.value },
      );
      externalDataCache.value[fieldKey] = data;
    } finally {
      externalDataLoading.value = null;
    }
  }

  showExternalDialog.value = true;
}

function toggleExternalOption(option: string) {
  if (externalDialogMultiple.value) {
    const idx = externalDialogTemp.value.indexOf(option);
    if (idx >= 0) externalDialogTemp.value.splice(idx, 1);
    else externalDialogTemp.value.push(option);
  } else {
    formData.value[externalDialogField.value] = option;
    showExternalDialog.value = false;
  }
}

function confirmExternalSelection() {
  formData.value[externalDialogField.value] = [...externalDialogTemp.value];
  showExternalDialog.value = false;
}

function externalDisplayValue(key: string): string {
  const val = formData.value[key];
  if (!val) return "";
  return Array.isArray(val) ? val.join(", ") : String(val);
}

// ── Sauvegarde ────────────────────────────────────────────────────────────
const saving = ref(false);
const saveError = ref<string | null>(null);

async function save() {
  saving.value = true;
  saveError.value = null;
  try {
    const idD = await ensureDocExists();

    // Champs texte / select / checkbox / date + classification (externalData → PATCH normal)
    const textData: Record<string, any> = {};
    for (const tab of tabs.value) {
      for (const key of tab.fields) {
        const def = fluxDef.value[key];
        if (!def || def.type === "file" || key === "type_piece") continue;
        if (formData.value[key] !== undefined) textData[key] = formData.value[key];
      }
    }

    await $fetch(`/entite/${props.entiteId}/document/${idD}`, {
      method: "PATCH",
      baseURL: config.public.apiBaseUrl,
      headers: headers.value,
      body: { doc_info: textData },
    });

    // Fichiers
    for (const [key, files] of Object.entries(pendingFiles.value)) {
      if (!files.length) continue;
      const form = new FormData();
      for (const file of files) form.append("files", file, file.name);
      await fetch(
        `${config.public.apiBaseUrl}/entite/${props.entiteId}/document/${idD}/file/${key}`,
        { method: "POST", headers: headers.value, body: form },
      );
    }

    // type_piece → PATCH spécial externalData
    const typePiece = formData.value.type_piece;
    if (typePiece?.length) {
      const pieces = Array.isArray(typePiece) ? typePiece : [typePiece];
      await $fetch(`/entite/${props.entiteId}/document/${idD}/externalData/type_piece`, {
        method: "PATCH",
        baseURL: config.public.apiBaseUrl,
        headers: headers.value,
        body: pieces,
      });
    }

    router.push(`/org/${props.entiteId}/document/${idD}?type=${props.fluxType ?? ""}`);
  } catch (e: any) {
    saveError.value = e?.data?.detail ?? e?.message ?? "Erreur lors de la sauvegarde";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <button
      class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      @click="router.back()"
    >
      <i class="pi pi-arrow-left text-xs" />
      Retour
    </button>

    <div v-if="pending && !isNew" class="space-y-4">
      <div v-for="i in 6" :key="i" class="h-12 bg-gray-100 rounded animate-pulse" />
    </div>

    <template v-else>
      <h1 class="text-2xl font-bold text-gray-900 mb-6">
        {{ isNew ? "Nouveau document" : (document?.info?.titre || "Éditer le document") }}
      </h1>

      <!-- Onglets -->
      <div class="border-b border-gray-200 mb-0">
        <nav class="flex gap-0">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="activeTab === tab.id
              ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
              : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'"
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
          <div class="w-1/3 h-3 bg-gray-200 rounded animate-pulse" />
          <div class="w-1/2 h-3 bg-gray-100 rounded animate-pulse ml-8" />
        </div>
      </div>

      <!-- Champs -->
      <div v-else class="border border-t-0 border-gray-200 rounded-b-lg rounded-tr-lg overflow-hidden">
        <table class="min-w-full text-sm">
          <tbody class="divide-y divide-gray-100">
            <tr v-if="tabFields.length === 0">
              <td colspan="2" class="px-4 py-6 text-center text-gray-400 italic">
                Aucun champ disponible
              </td>
            </tr>
            <tr v-for="field in tabFields" :key="field!.key" class="even:bg-gray-50">
              <!-- Label -->
              <td class="px-4 py-3 font-medium text-gray-600 w-1/3 align-top whitespace-nowrap">
                {{ field!.label }}
                <span v-if="field!.required" class="text-red-500 ml-1">*</span>
                <span
                  v-if="field!.commentaire"
                  class="block text-xs text-gray-400 font-normal max-w-xs whitespace-normal mt-0.5"
                >{{ field!.commentaire.replace(/<[^>]*>/g, "") }}</span>
              </td>

              <!-- Contrôle -->
              <td class="px-4 py-3">
                <!-- Select -->
                <template v-if="field!.type === 'select'">
                  <select
                    v-model="formData[field!.key]"
                    :disabled="field!.readonly"
                    class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">...</option>
                    <option v-for="(label, val) in field!.selectValues" :key="val" :value="val">
                      {{ label }}
                    </option>
                  </select>
                </template>

                <!-- Fichier -->
                <template v-else-if="field!.type === 'file'">
                  <input
                    type="file"
                    :multiple="field!.multiple"
                    class="text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded file:border file:border-gray-300 file:text-sm file:bg-white file:hover:bg-gray-50 cursor-pointer"
                    @change="onFileChange(field!.key, $event)"
                  />
                  <p v-if="formData[field!.key]?.length" class="mt-1 text-xs text-gray-400">
                    Actuel :
                    {{ Array.isArray(formData[field!.key]) ? formData[field!.key].join(", ") : formData[field!.key] }}
                  </p>
                </template>

                <!-- Checkbox -->
                <template v-else-if="field!.type === 'checkbox'">
                  <input
                    v-model="formData[field!.key]"
                    type="checkbox"
                    true-value="checked"
                    false-value=""
                    class="w-4 h-4 accent-blue-600"
                  />
                </template>

                <!-- Date -->
                <template v-else-if="field!.type === 'date'">
                  <input
                    v-model="formData[field!.key]"
                    type="date"
                    class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </template>

                <!-- ExternalData (classification, type_piece) -->
                <template v-else-if="field!.type === 'externalData'">
                  <div class="flex items-center gap-3">
                    <span
                      v-if="externalDisplayValue(field!.key)"
                      class="text-sm text-gray-700 flex-1 min-w-0 truncate"
                    >{{ externalDisplayValue(field!.key) }}</span>
                    <span v-else class="text-sm text-gray-400 italic flex-1">Non renseigné</span>
                    <Button
                      :label="externalDisplayValue(field!.key) ? 'Modifier' : 'Sélectionner'"
                      icon="pi pi-list"
                      severity="secondary"
                      size="small"
                      :loading="externalDataLoading === field!.key"
                      @click="openExternalDialog(field!.key, field!.label)"
                    />
                  </div>
                </template>

                <!-- Texte (fallback) -->
                <template v-else>
                  <input
                    v-model="formData[field!.key]"
                    type="text"
                    :disabled="field!.readonly"
                    class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="saveError" class="mt-4 text-sm text-red-700 bg-red-50 px-4 py-3 rounded border border-red-300">
        {{ saveError }}
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

    <!-- Dialog externalData (classification / type_piece) -->
    <Dialog
      v-model:visible="showExternalDialog"
      :header="`Sélectionner — ${externalDialogLabel}`"
      modal
      :style="{ width: '520px' }"
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

      <div class="max-h-96 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded">
        <div v-if="!filteredExternalOptions.length" class="px-3 py-4 text-center text-gray-400 italic text-sm">
          Aucun résultat
        </div>
        <button
          v-for="opt in filteredExternalOptions"
          :key="opt"
          type="button"
          class="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center gap-2 transition-colors"
          :class="externalDialogTemp.includes(opt) ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'"
          @click="toggleExternalOption(opt)"
        >
          <i
            v-if="externalDialogMultiple"
            :class="externalDialogTemp.includes(opt) ? 'pi pi-check-square text-blue-600' : 'pi pi-stop text-gray-300'"
          />
          <i v-else-if="externalDialogTemp.includes(opt)" class="pi pi-check text-blue-600" />
          {{ opt }}
        </button>
      </div>

      <template v-if="externalDialogMultiple" #footer>
        <Button label="Annuler" severity="secondary" @click="showExternalDialog = false" />
        <Button
          :label="`Valider (${externalDialogTemp.length})`"
          :disabled="externalDialogTemp.length === 0"
          @click="confirmExternalSelection"
        />
      </template>
    </Dialog>
  </div>
</template>
