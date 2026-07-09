<script setup lang="ts">
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";

const props = defineProps<{
  entiteId: number;
  idD: string;
  fluxType?: string;
}>();

const config = useRuntimeConfig();
const router = useRouter();
const { user, authHeaders } = useUserContext();
const { getFluxDef, fluxDefFor } = useFluxDef();
const queryClient = useQueryClient();

const isNew = computed(() => props.idD === "new");
const createdDocId = ref<string | null>(null);

// ── Fetch document (edit only) ────────────────────────────────────────────
const { data: doc, isPending } = useQuery({
  queryKey: computed(() => ["document", props.entiteId, props.idD]),
  queryFn: async () => {
    if (isNew.value) return null;
    return await $fetch<any>(
      `/entite/${props.entiteId}/document/${props.idD}`,
      { baseURL: config.public.apiBaseUrl, headers: authHeaders.value },
    );
  },
  enabled: computed(() => !isNew.value && !!user.value?.token),
  staleTime: 30_000,
  placeholderData: (prev) => prev,
});

// ── Flux def ──────────────────────────────────────────────────────────────
const fluxDef = computed(() => {
  const type = props.fluxType ?? doc.value?.info?.type;
  if (!type) return {};
  return fluxDefFor(type);
});

watch(
  () => ({
    token: user.value?.token,
    type: props.fluxType ?? doc.value?.info?.type,
  }),
  async ({ token, type }) => {
    if (token && type) await getFluxDef(type);
  },
  { immediate: true },
);

// Surcharges par onglet pour le formulaire (champs différents de la vue détail)
const FORM_TAB_FIELD_OVERRIDES: Record<string, Record<string, string[]>> = {
  preparer: {
    "deliberations-studio": [
      "acte_nature",
      "numero_de_lacte",
      "objet",
      "comment",
      "arrete",
      "autre_document_attache",
      "publication_open_data",
    ],
    "arretes-individuels-studio": [
      "acte_nature",
      "numero_de_lacte",
      "objet",
      "comment",
      "arrete",
      "autre_document_attache",
      "publication_open_data",
    ],
    "actes-reglementaires-studio": [
      "acte_nature",
      "numero_de_lacte",
      "objet",
      "comment",
      "arrete",
      "autre_document_attache",
      "publication_open_data",
    ],
    "autres-studio": [
      "acte_nature",
      "numero_de_lacte",
      "objet",
      "comment",
      "arrete",
      "autre_document_attache",
      "publication_open_data",
    ],
    "contrats-studio": [
      "acte_nature",
      "numero_de_lacte",
      "objet",
      "comment",
      "arrete",
      "autre_document_attache",
      "publication_open_data",
    ],
    "documents-budgetaires-studio": [
      "acte_nature",
      "numero_de_lacte",
      "objet",
      "comment",
      "arrete",
      "autre_document_attache",
      "publication_open_data",
    ],
    "autres-studio-sans-tdt": [
      "acte_nature",
      "nature_autre_detail",
      "numero_de_lacte",
      "objet",
      "date_de_lacte",
      "classification",
      "arrete",
      "autre_document_attache",
      "publication_open_data",
    ],
  },
  acte: {
    default: [
      "date_de_lacte",
      "document_papier",
      "classification",
      "type_piece",
    ],
  },
};

const tabs = computed(() => {
  const type = props.fluxType ?? doc.value?.info?.type ?? "";
  const data = doc.value?.data ?? {};
  const configTabs = FLUX_TABS_CONFIG[type] ?? [];

  return configTabs
    .filter((tab) => !tab.condition || tab.condition(data))
    .map((tab) => {
      const override = FORM_TAB_FIELD_OVERRIDES[tab.id];
      const fields = override?.[type] ?? override?.["default"] ?? tab.fields;
      return { ...tab, fields };
    });
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
      const commentaire = def.commentaire ?? null;
      return {
        key,
        label: def.name ?? key.replace(/_/g, " "),
        type: def.type ?? "text",
        required: def.requis ?? false,
        multiple: def.multiple ?? false,
        selectValues: def.value ?? null,
        commentaire,
        accept:
          def.type === "file" ? parseAcceptFromComment(commentaire) : null,
        readonly:
          !!def["read-only"] ||
          key === "acte_nature" ||
          (key === "envoi_depot" &&
            props.fluxType === "autres-studio-sans-tdt"),
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
  "autres-studio-sans-tdt": {
    envoi_depot: "checked",
  },
};

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

// ── Données du formulaire ─────────────────────────────────────────────────
const formData = ref<Record<string, any>>(
  doc.value?.data ? { ...doc.value.data } : {},
);

watch(
  doc,
  (d) => {
    if (!d?.data || Object.keys(formData.value).length) return;
    formData.value = { ...d.data };
  },
  { immediate: true },
);

// Pré-remplit les valeurs par défaut pour un nouveau document
watch(
  fluxDef,
  () => {
    if (!isNew.value) return;
    const type = props.fluxType ?? "";

    if (!formData.value.acte_nature) {
      const options = fluxDef.value.acte_nature?.value as
        | Record<string, string>
        | undefined;
      if (options) formData.value.acte_nature = Object.keys(options)[0];
    }

    if (!formData.value.date_de_lacte) {
      formData.value.date_de_lacte = todayISO();
    }

    const defaults = FORM_DEFAULTS[type] ?? {};
    for (const [key, val] of Object.entries(defaults)) {
      if (!formData.value[key]) formData.value[key] = val;
    }
  },
  { immediate: true },
);

// ── Fichiers ──────────────────────────────────────────────────────────────

// Extrait ".pdf,.doc,.docx" depuis un commentaire "format PDF, DOC, DOCX ou ODT"
function parseAcceptFromComment(comment: string | null): string | null {
  if (!comment) return null;
  const matches = comment.match(
    /\b(PDF|DOC|DOCX|ODT|XLS|XLSX|ODS|PNG|JPG|JPEG|GIF|ZIP|XML|CSV|TXT|RTF|ODP|PPT|PPTX)\b/gi,
  );
  if (!matches?.length) return null;
  return matches.map((ext) => `.${ext.toLowerCase()}`).join(",");
}

const pendingFiles = ref<Record<string, File[]>>({});

function onFileChange(key: string, event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;
  pendingFiles.value[key] = Array.from(input.files);
}

function removeFile(key: string, file: File) {
  pendingFiles.value[key] = pendingFiles.value[key].filter((f) => f !== file);
}

// ── ExternalData (classification, type_piece) ─────────────────────────────
const externalDataCache = ref<Record<string, Record<string, boolean>>>({});
const externalDataLoading = ref<string | null>(null);
const showExternalDialog = ref(false);
const externalDialogField = ref("");
const externalDialogLabel = ref("");
const externalDialogSearch = ref("");
const externalDialogTemp = ref<string[]>([]);
const externalDialogHadSelection = ref(false);

// Dialog dédié pour type_piece (sélection par pièce)
const showTypePieceDialog = ref(false);
const typePieceTypesList = ref<Record<string, string>>({});
const typePieceItems = ref<{ piece: string; label: string }[]>([]);

const filteredExternalOptions = computed(() => {
  const vals = externalDataCache.value[externalDialogField.value] ?? {};
  const keys = Object.keys(vals);
  const q = externalDialogSearch.value.trim().toLowerCase();
  return q ? keys.filter((k) => k.toLowerCase().includes(q)) : keys;
});

function isExternalOptionHeader(opt: string): boolean {
  return /^\d+\s/.test(opt) && !/^\d+\.\d+/.test(opt);
}

async function fetchWithRefresh<T>(url: string, opts: any): Promise<T> {
  try {
    return await $fetch<T>(url, { baseURL: config.public.apiBaseUrl, headers: authHeaders.value, ...opts });
  } catch (e: any) {
    if (e?.status === 403 || e?.response?.status === 403) {
      const newToken = await tryRefreshToken();
      if (newToken)
        return await $fetch<T>(url, { baseURL: config.public.apiBaseUrl, headers: { Authorization: `Bearer ${newToken}` }, ...opts });
    }
    throw e;
  }
}

async function ensureDocExists(): Promise<string> {
  if (!isNew.value) return props.idD;
  if (createdDocId.value) return createdDocId.value;
  const response = await $fetch<any>(`/entite/${props.entiteId}/document`, {
    method: "POST",
    baseURL: config.public.apiBaseUrl,
    headers: authHeaders.value,
    body: { flux_type: props.fluxType, doc_info: {} },
  });
  createdDocId.value = response.info.id_d;
  return createdDocId.value;
}

// Liste des fichiers réellement attachés (déjà uploadés ou en attente d'upload)
// pour les champs de type "file", dans l'ordre des onglets. Sert à faire
// correspondre le nombre de pièces attendu par Pastell lors de l'envoi.
function buildLocalPieces(): string[] {
  const pieces: string[] = [];
  for (const tab of tabs.value) {
    for (const key of tab.fields) {
      const def = fluxDef.value[key];
      if (!def || def.type !== "file") continue;
      const files = pendingFiles.value[key];
      if (files?.length) {
        for (const f of files) pieces.push(f.name);
        continue;
      }
      const existing = formData.value[key];
      if (Array.isArray(existing)) pieces.push(...existing.filter(Boolean));
      else if (existing) pieces.push(String(existing));
    }
  }
  return pieces;
}

async function openExternalDialog(fieldKey: string, fieldLabel: string) {
  // type_piece : dialog dédié avec sélection par pièce
  if (fieldKey === "type_piece") {
    externalDataLoading.value = fieldKey;
    try {
      const docId = createdDocId.value ?? (!isNew.value ? props.idD : null);
      const url = docId
        ? `/entite/${props.entiteId}/document/${docId}/externalData/type_piece`
        : `/entite/${props.entiteId}/flux/${props.fluxType ?? ""}/externalData/type_piece`;
      const data = await fetchWithRefresh<any>(url, { retry: 0 });

      // Le nombre de pièces renvoyé par le serveur peut être erroné : sans docId,
      // il provient d'un autre document du même flux (emprunté par le backend) et
      // ne reflète pas les fichiers réellement attachés localement (pas encore envoyés).
      // On reconstruit donc la liste des pièces à partir des fichiers du formulaire.
      const localPieces = buildLocalPieces();
      const rawPieces = localPieces.length ? localPieces : (data.pieces ?? []);
      typePieceTypesList.value = data.actes_type_pj_list ?? {};

      // code → label pour la conversion quelle que soit la source
      const codeToLabel = typePieceTypesList.value;
      const labelSet = new Set(Object.values(codeToLabel));
      const current = formData.value["type_piece"];
      const currentArr = Array.isArray(current)
        ? current
        : current
          ? [current]
          : [];

      typePieceItems.value = rawPieces.map((p: any, i: number) => {
        const piece = typeof p === "string" ? p : (p.filename ?? String(p));
        // Priorité : type_pj de la réponse Pastell, sinon formData local
        const raw =
          typeof p === "object" && p.type_pj
            ? p.type_pj
            : (currentArr[i] ?? "");
        const label = labelSet.has(raw) ? raw : (codeToLabel[raw] ?? "");
        return { piece, label };
      });

      showTypePieceDialog.value = true;
    } catch (e: any) {
      const status = e?.status ?? e?.response?.status;
      if (status === 400) {
        const hasPending = Object.values(pendingFiles.value).some(
          (f) => f.length > 0,
        );
        saveError.value = hasPending
          ? "Enregistrez d'abord le document pour téléverser le fichier acte, puis sélectionnez les types de pièces."
          : "Veuillez d'abord téléverser un fichier acte avant de définir les types de pièces.";
      } else {
        saveError.value =
          e?.data?.detail ??
          e?.message ??
          "Impossible de charger les types de pièces";
      }
    } finally {
      externalDataLoading.value = null;
    }
    return;
  }

  externalDialogField.value = fieldKey;
  externalDialogLabel.value = fieldLabel;
  externalDialogSearch.value = "";

  const current = formData.value[fieldKey];
  externalDialogTemp.value = Array.isArray(current)
    ? [...current]
    : current
      ? [current]
      : [];
  externalDialogHadSelection.value = externalDialogTemp.value.length > 0;

  if (!externalDataCache.value[fieldKey]) {
    externalDataLoading.value = fieldKey;
    try {
      const docId = createdDocId.value ?? (!isNew.value ? props.idD : null);
      const externalDataUrl = docId
        ? `/entite/${props.entiteId}/document/${docId}/externalData/${fieldKey}`
        : `/entite/${props.entiteId}/flux/${props.fluxType ?? ""}/externalData/${fieldKey}`;
      const data = await $fetch<Record<string, boolean>>(externalDataUrl, {
        baseURL: config.public.apiBaseUrl,
        headers: authHeaders.value,
      });
      externalDataCache.value[fieldKey] = data;
    } catch (e: any) {
      saveError.value =
        e?.data?.detail ??
        e?.message ??
        `Impossible de charger les options pour « ${fieldLabel} »`;
      externalDataLoading.value = null;
      return;
    } finally {
      externalDataLoading.value = null;
    }
  }

  showExternalDialog.value = true;
}

function confirmTypePieceSelection() {
  formData.value["type_piece"] = typePieceItems.value.map((item) => item.label);
  showTypePieceDialog.value = false;
}

function toggleExternalOption(option: string) {
  formData.value[externalDialogField.value] = option;
  showExternalDialog.value = false;
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
const saveError = ref<string | null>(null);

const { mutateAsync: saveDoc, isPending: saving } = useMutation({
  mutationFn: async () => {
    const idD = await ensureDocExists();

    const textData: Record<string, any> = {};
    for (const tab of tabs.value) {
      for (const key of tab.fields) {
        const def = fluxDef.value[key];
        if (!def || def.type === "file" || key === "type_piece") continue;
        if (formData.value[key] !== undefined)
          textData[key] = formData.value[key];
      }
    }

    await fetchWithRefresh(`/entite/${props.entiteId}/document/${idD}`, {
      method: "PATCH",
      body: { doc_info: textData },
    });

    for (const [key, files] of Object.entries(pendingFiles.value)) {
      if (!files.length) continue;
      const fieldDef = fluxDef.value[key];
      const isMultiple = fieldDef?.multiple ?? false;
      const form = new FormData();
      for (const file of files) form.append("files", file, file.name);
      const uploadUrl = `${config.public.apiBaseUrl}/entite/${props.entiteId}/document/${idD}/file/${key}${isMultiple ? "" : "?replace=true"}`;
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: authHeaders.value,
        body: form,
      });
      if (!uploadRes.ok) {
        let detail = `Erreur lors de l'upload du fichier (${uploadRes.status})`;
        try {
          detail = (await uploadRes.json())?.detail ?? detail;
        } catch {}
        throw new Error(detail);
      }
    }

    const typePiece = formData.value.type_piece;
    if (typePiece) {
      const rawPieces = Array.isArray(typePiece) ? typePiece : [typePiece];
      const codes = rawPieces.map(
        (p: string) => p.match(/\(([^)]+)\)$/)?.[1] ?? p,
      );
      await fetchWithRefresh(
        `/entite/${props.entiteId}/document/${idD}/externalData/type_piece`,
        { method: "PATCH", body: codes },
      );
    }

    return idD;
  },
  onSuccess: (idD) => {
    queryClient.invalidateQueries({
      queryKey: ["document", props.entiteId, idD],
    });
    router.push(
      `/org/${props.entiteId}/document/${idD}?type=${props.fluxType ?? ""}`,
    );
  },
  onError: (e: any) => {
    saveError.value =
      e?.data?.detail ?? e?.message ?? "Erreur lors de la sauvegarde";
  },
});

async function save() {
  saveError.value = null;
  for (const tab of tabs.value) {
    for (const key of tab.fields) {
      const def = fluxDef.value[key];
      if (!def?.requis || key === "type_piece") continue;
      const isEmpty =
        def.type === "file"
          ? !pendingFiles.value[key]?.length && !formData.value[key]
          : !formData.value[key] ||
            (Array.isArray(formData.value[key]) &&
              !formData.value[key].length) ||
            formData.value[key] === "";
      if (isEmpty) {
        saveError.value = `Le formulaire est incomplet : le champ « ${def.name ?? key.replace(/_/g, " ")} » est obligatoire.`;
        return;
      }
    }
  }
  await saveDoc();
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
            <template v-for="field in tabFields" :key="field!.key">
              <!-- Notice (champ sans label, ex: "comment") -->
              <tr v-if="field!.label === '_'">
                <td
                  colspan="2"
                  class="px-4 py-3 text-xs text-amber-700 bg-amber-50 border-l-4 border-amber-400"
                >
                  {{ field!.commentaire }}
                </td>
              </tr>
              <tr v-else class="even:bg-gray-50">
                <!-- Label -->
                <td
                  class="px-4 py-3 font-medium text-gray-600 w-1/3 align-top whitespace-nowrap"
                >
                  {{ field!.label }}
                  <span v-if="field!.required" class="text-red-500 ml-1"
                    >*</span
                  >
                  <span
                    v-if="field!.commentaire"
                    class="block text-xs text-gray-400 font-normal max-w-xs whitespace-normal mt-0.5"
                    >{{ field!.commentaire.replace(/<[^>]*>/g, "") }}</span
                  >
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
                      <option
                        v-for="(label, val) in field!.selectValues"
                        :key="val"
                        :value="val"
                      >
                        {{ label }}
                      </option>
                    </select>
                  </template>

                  <!-- Fichier -->
                  <template v-else-if="field!.type === 'file'">
                    <label
                      class="inline-flex items-center gap-2 px-3 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 cursor-pointer w-fit"
                    >
                      <span
                        >Choisir
                        {{
                          field!.multiple ? "des fichiers" : "un fichier"
                        }}</span
                      >
                      <input
                        :key="pendingFiles[field!.key]?.length ?? 0"
                        type="file"
                        :multiple="field!.multiple"
                        :accept="field!.accept ?? undefined"
                        class="sr-only"
                        @change="onFileChange(field!.key, $event)"
                      />
                    </label>
                    <div
                      v-if="pendingFiles[field!.key]?.length"
                      class="mt-1 flex flex-wrap gap-1"
                    >
                      <span
                        v-for="f in pendingFiles[field!.key]"
                        :key="f.name"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs"
                      >
                        {{ f.name }}
                        <button
                          type="button"
                          class="hover:text-red-500"
                          @click="removeFile(field!.key, f)"
                        >
                          ×
                        </button>
                      </span>
                    </div>
                    <p
                      v-else-if="formData[field!.key]?.length"
                      class="mt-1 text-xs text-gray-400"
                    >
                      Actuel :
                      {{
                        Array.isArray(formData[field!.key])
                          ? formData[field!.key].join(", ")
                          : formData[field!.key]
                      }}
                    </p>
                  </template>

                  <!-- Checkbox -->
                  <template v-else-if="field!.type === 'checkbox'">
                    <input
                      type="checkbox"
                      :checked="
                        formData[field!.key] === 'checked' ||
                        formData[field!.key] === '1'
                      "
                      :disabled="field!.readonly"
                      class="w-4 h-4 accent-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                      @change="
                        formData[field!.key] = (
                          $event.target as HTMLInputElement
                        ).checked
                          ? 'checked'
                          : ''
                      "
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
                    <div class="flex items-start gap-3">
                      <span
                        v-if="externalDisplayValue(field!.key)"
                        class="text-sm text-gray-700 flex-1 min-w-0 break-words"
                        >{{ externalDisplayValue(field!.key) }}</span
                      >
                      <span v-else class="text-sm text-gray-400 italic flex-1"
                        >Non renseigné</span
                      >
                      <Button
                        :label="
                          externalDisplayValue(field!.key)
                            ? 'Modifier'
                            : 'Sélectionner'
                        "
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
            </template>
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
      :style="{ width: '680px' }"
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
