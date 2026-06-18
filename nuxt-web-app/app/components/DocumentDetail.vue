<script setup lang="ts">
const props = defineProps<{ entiteId: number; idD: string; fluxType: string; }>();

const config = useRuntimeConfig();
const router = useRouter();
const { user } = useUserContext();
const { getFluxDef } = useFluxDef();

const headers = computed(() => ({
  Authorization: `Bearer ${user.value?.token}`,
}));

// ── Fetch document ────────────────────────────────────────────────────────────
const {
  data: document,
  pending,
  error,
  refresh,
} = useAsyncData(
  `document-${props.entiteId}-${props.idD}`,
  async () => {
    if (!user.value?.token) return null;
    const result = await $fetch<any>(
      `/entite/${props.entiteId}/document/${props.idD}`,
      {
        baseURL: config.public.apiBaseUrl,
        headers: headers.value,
      },
    );
    console.log("[DocumentDetail]", JSON.stringify(result, null, 2));
    return result;
  },
  { server: false, watch: [computed(() => !!user.value?.token)] },
);


// ── Fetch journal ─────────────────────────────────────────────────────────────
const journal = ref<any[]>([]);
const journalPending = ref(false);

async function refreshJournal() {
  if (!user.value?.token) return;
  journalPending.value = true;
  try {
    journal.value = await $fetch<any[]>(
      `/entite/${props.entiteId}/document/${props.idD}/journal`,
      { baseURL: config.public.apiBaseUrl, headers: headers.value },
    );
  } catch {
    journal.value = [];
  } finally {
    journalPending.value = false;
  }
}

watch(() => user.value?.token, (token) => { if (token) refreshJournal(); }, { immediate: true });

// ── Fetch définition du flux (avec cache global par type) ────────────────────
const { data: fluxDefData } = useAsyncData(
  `flux-${props.entiteId}-${props.idD}`,
  async () => {
    const type = props.fluxType ?? document.value?.info?.type;
    if (!type || !user.value?.token) return {};
    const def = await getFluxDef(type);
    console.log("[DocumentDetail] fluxDef:", JSON.stringify(def, null, 2));
    return def;
  },
  { server: false, watch: [computed(() => !!user.value?.token), () => document.value?.info?.type] },
);

const fluxDef = computed(() => fluxDefData.value ?? {});

// ── Définition des onglets par flux ──────────────────────────────────────────

// Onglets disponibles selon le type de flux (filtrés par condition)
const tabs = computed(() => {
  const fluxType = document.value?.info?.type;
  const config = FLUX_TABS_CONFIG[fluxType];
  if (!config) return [{ id: "preparer", label: "Préparer", fields: [] }];
  const data = document.value?.data ?? {};
  return config.filter((tab) => !tab.condition || tab.condition(data));
});

const activeTab = ref("preparer");

// Reset onglet actif quand le flux change
watch(tabs, () => {
  activeTab.value = "preparer";
});

// ── Champs de l'onglet actif ──────────────────────────────────────────────────
const activeTabFields = computed(() => {
  if (!document.value?.data) return [];

  const tab = tabs.value.find((t) => t.id === activeTab.value);
  if (!tab) return [];

  const fluxType = document.value?.info?.type;
  if (!FLUX_TABS_CONFIG[fluxType] && tab.id === "preparer") {
    return getFilteredFields();
  }

  const alwaysShow = new Set(tab.alwaysShow ?? []);
  return tab.fields
    .map((key) => {
      const def = fluxDef.value[key];
      const val = document.value.data[key];
      const isEmpty =
        val === undefined ||
        val === null ||
        val === "" ||
        val === "[]" ||
        (Array.isArray(val) && val.length === 0);
      if (isEmpty && !alwaysShow.has(key)) return null;
      return {
        key,
        val: isEmpty ? null : val,
        label: def?.name ?? key.replace(/_/g, " "),
        type: def?.type ?? "text",
        selectValues: def?.value ?? null,
        commentaire: def?.commentaire ?? null,
      };
    })
    .filter(Boolean);
});

// filterFields pour flux sans config
function getFilteredFields() {
  return Object.entries(fluxDef.value)
    .filter(([key, def]: [string, any]) => {
      if (def?.["no-show"]) return false;
      if (!def?.type) return false;
      if (def?.requis) {
        if (def.type === "file" && def["read-only"]) return false;
        return true;
      }
      if (def?.["read-only"] === true) return false;
      if ((def?.type === "date" || def?.type === "file") && !def?.commentaire)
        return false;
      return true;
    })
    .filter(([key]) => key !== "type_piece")
    .map(([key, def]: [string, any]) => ({
      key,
      val: document.value.data[key] ?? null,
      label: def?.name ?? key.replace(/_/g, " "),
      type: def?.type ?? "text",
      selectValues: def?.value ?? null,
      commentaire: def?.commentaire ?? null,
    }))
    .filter(
      ({ val }) =>
        val !== null &&
        val !== "" &&
        val !== "[]" &&
        !(Array.isArray(val) && val.length === 0),
    );
}

// ── Actions ───────────────────────────────────────────────────────────────────
const actionLoading = ref<string | null>(null);
const actionError = ref<string | null>(null);

// ── Journal filtré/dédupliqué ─────────────────────────────────────────────────
const journalEntries = computed(() => {
  const entries = (journal.value ?? [])
    .filter((e: any) => e.type === "1")
    .slice()
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const deduped: any[] = [];
  for (let i = 0; i < entries.length; i++) {
    if (i === entries.length - 1 || entries[i].action !== entries[i + 1].action) {
      deduped.push(entries[i]);
    }
  }
  return deduped.reverse().slice(0, 13);
});

const journalUser = (entry: any) => {
  const name = [entry.prenom, entry.nom].filter(Boolean).join(" ");
  return name || "Action automatique";
};

async function runAction(action: { action: string; message: string }) {
  actionLoading.value = action.action;
  actionError.value = null;
  try {
    await $fetch(
      `/entite/${props.entiteId}/documents/perform_action`,
      {
        method: "POST",
        baseURL: config.public.apiBaseUrl,
        headers: headers.value,
        body: { document_ids: props.idD, action: action.action },
      },
    );
    await Promise.all([refresh(), refreshJournal()]);
  } catch (e: any) {
    if (
      e?.status === 403 &&
      e?.data?.detail?.toLowerCase().includes("credential")
    ) {
      actionError.value = "Votre session a expiré, veuillez recharger la page.";
    } else {
      actionError.value =
        e?.data?.detail ?? e?.message ?? "Une erreur est survenue";
    }
  } finally {
    actionLoading.value = null;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (d: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

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

const shortMessage = (msg: string) => {
  if (!msg) return "—";
  const idx = msg.indexOf(" : ");
  return idx !== -1 ? msg.substring(0, idx) : msg;
};

const ACTION_SEVERITY: Record<string, string> = {
  modification: "secondary",
  supression: "danger",
};
const actionSeverity = (action: string) => ACTION_SEVERITY[action] ?? "primary";

const ACTION_ICONS: Record<string, string> = {
  modification: "pi-pencil",
  supression: "pi-trash",
  orientation: "pi-send",
  duplicate: "pi-copy",
  reouverture: "pi-refresh",
  "annulation-tdt": "pi-times",
};
const actionIcon = (action: string) => ACTION_ICONS[action] ?? "pi-info-circle";
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <!-- Retour -->
    <button
      class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      @click="router.back()"
    >
      <i class="pi pi-arrow-left text-xs" />
      Retour à la liste
    </button>

    <!-- Loading -->
    <div v-if="pending" class="space-y-4">
      <div class="h-8 w-64 bg-gray-200 rounded animate-pulse" />
      <div class="h-4 w-40 bg-gray-100 rounded animate-pulse" />
      <div class="mt-6 space-y-2">
        <div
          v-for="i in 8"
          :key="i"
          class="h-10 bg-gray-100 rounded animate-pulse"
        />
      </div>
    </div>

    <div v-else-if="error" class="text-red-600 py-4">
      Erreur lors du chargement du document.
    </div>

    <template v-else-if="document">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              {{ document.info.titre || "Sans titre" }}
            </h1>
            <p class="text-sm text-gray-500 mt-1">{{ document.info.type }}</p>
          </div>
          <span
            class="shrink-0 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100"
            :title="document.last_action_message || document.last_action || ''"
          >
            {{
              shortMessage(document.last_action_message || document.last_action)
            }}
          </span>
        </div>
        <div class="flex gap-6 mt-3 text-xs text-gray-400">
          <span>Créé le {{ formatDate(document.info.creation) }}</span>
          <span>Modifié le {{ formatDate(document.info.modification) }}</span>
          <span
            >Dernier état le {{ formatDate(document.last_action_date) }}</span
          >
        </div>
      </div>

      <!-- Actions -->
      <div
        v-if="document.action_possible?.length"
        class="flex flex-wrap gap-2 mb-6"
      >
        <Button
          v-for="action in document.action_possible.filter((a: any) => a.message)"
          :key="action.action"
          :label="action.message"
          :icon="actionLoading === action.action ? 'pi pi-spinner pi-spin' : `pi ${actionIcon(action.action)}`"
          :severity="actionSeverity(action.action)"
          :disabled="!!actionLoading"
          @click="runAction(action)"
        />
      </div>

      <div
        v-if="actionError"
        class="mb-4 text-sm text-red-700 bg-red-50 px-4 py-3 rounded border border-red-300 w-full"
      >
        {{ actionError }}
      </div>

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

      <!-- Contenu onglet actif -->
      <div
        class="rounded-b-lg rounded-tr-lg border border-t-0 border-gray-200 overflow-hidden"
      >
        <!-- Skeleton flux pas encore chargé -->
        <div
          v-if="!Object.keys(fluxDef).length"
          class="divide-y divide-gray-100"
        >
          <div v-for="i in 5" :key="i" class="flex px-4 py-3 even:bg-gray-50">
            <div class="w-1/3 h-3 bg-gray-200 rounded animate-pulse" />
            <div class="w-1/2 h-3 bg-gray-100 rounded animate-pulse ml-8" />
          </div>
        </div>

        <template v-else>
          <table class="min-w-full text-sm">
            <tbody class="divide-y divide-gray-100">
              <tr v-if="activeTabFields.length === 0">
                <td
                  colspan="2"
                  class="px-4 py-6 text-center text-gray-400 italic"
                >
                  Aucun champ disponible
                </td>
              </tr>
              <tr
                v-for="field in activeTabFields"
                :key="field.key"
                class="even:bg-gray-50"
              >
                <td
                  class="px-4 py-3 font-medium text-gray-600 w-1/3 align-top whitespace-nowrap"
                >
                  {{ field.label }}
                </td>
                <td class="px-4 py-3 text-gray-800">
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
                      v-for="(filename, i) in (Array.isArray(field.val) ? field.val : [field.val]) as string[]"
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

                  <!-- Select -->
                  <template v-else-if="field.type === 'select'">
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
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </div>

      <!-- États du dossier -->
      <div class="mt-6 border border-gray-200 rounded-lg overflow-hidden">
        <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 class="text-sm font-semibold text-gray-700">États du dossier</h2>
        </div>
        <div v-if="journalPending" class="divide-y divide-gray-100">
          <div v-for="i in 3" :key="i" class="flex gap-4 px-4 py-3">
            <div class="w-1/4 h-3 bg-gray-200 rounded animate-pulse" />
            <div class="w-1/4 h-3 bg-gray-100 rounded animate-pulse" />
            <div class="w-1/5 h-3 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
        <div
          v-else-if="!journalEntries.length"
          class="px-4 py-6 text-center text-gray-400 italic text-sm"
        >
          Aucun événement enregistré
        </div>
        <table v-else class="min-w-full text-sm">
          <thead class="bg-white border-b border-gray-100">
            <tr>
              <th class="px-4 py-2 text-left font-medium text-gray-600">État</th>
              <th class="px-4 py-2 text-left font-medium text-gray-600">Date</th>
              <th class="px-4 py-2 text-left font-medium text-gray-600">Utilisateur</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="entry in journalEntries"
              :key="entry.id_j"
              class="even:bg-gray-50"
            >
              <td class="px-4 py-2 text-gray-800 whitespace-nowrap">
                {{ entry.action_libelle || entry.action || "—" }}
              </td>
              <td class="px-4 py-2 text-gray-600 tabular-nums whitespace-nowrap">
                {{ formatDate(entry.date) }}
              </td>
              <td class="px-4 py-2 text-gray-600 whitespace-nowrap">
                {{ journalUser(entry) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
