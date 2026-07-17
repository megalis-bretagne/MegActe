<script setup lang="ts">
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";

const props = defineProps<{ idD: string; fluxType?: string }>();

const config = useRuntimeConfig();
const router = useRouter();
const { data: user } = useAuth();
const { getFluxDef } = useFluxDef();
const entiteId = useSelectedEntiteId();
const queryClient = useQueryClient();

// ── Fetch document ────────────────────────────────────────────────────────────
const {
  data: doc,
  isPending,
  error,
} = useQuery({
  queryKey: computed(() => ["document", entiteId.value, props.idD]),
  queryFn: async () => {
    const url = `/entite/${entiteId.value}/document/${props.idD}`;
    return await $fetch<any>(url, {
      baseURL: config.public.apiBaseUrl,
      headers: { Authorization: `Bearer ${user.value?.accessToken}` },
    });
  },
  staleTime: 30_000,
  placeholderData: (prev) => prev,
});

// ── Fetch journal ────────────────────────────────────────────────────────────
const { data: journalData, isPending: journalPending } = useQuery({
  queryKey: computed(() => ["journal", entiteId.value, props.idD]),
  queryFn: async () => {
    return await $fetch<any[]>(
      `/entite/${entiteId.value}/document/${props.idD}/journal`,
      {
        baseURL: config.public.apiBaseUrl,
        headers: { Authorization: `Bearer ${user.value?.accessToken}` },
      }
    );
  },
  staleTime: 30_000,
});

// Fetch FluxDetails
const fluxDef = ref<FluxDetails | null | undefined>(null);
if (props.fluxType) {
  fluxDef.value = await getFluxDef(props.fluxType);
}
const stop = watch(
  () => (fluxDef ? undefined : doc.value?.info?.type),
  async (type) => {
    if (type === undefined) return;
    fluxDef.value = await getFluxDef(type);
  },
  { immediate: true }
);
if (fluxDef.value) stop();

// Onglets disponibles selon le type de flux (filtrés par condition)
const tabs = computed(() => {
  const fluxType = doc.value?.info?.type;
  const config = FLUX_TABS_CONFIG[fluxType];
  if (!config) return [{ id: "preparer", label: "Préparer", fields: [] }];
  const data = doc.value?.data ?? {};
  return config.filter((tab) => !tab.condition || tab.condition(data));
});

const activeTab = ref("preparer");

// Reset onglet actif quand le flux change
watch(tabs, () => {
  activeTab.value = "preparer";
});

// ── Champs de l'onglet actif ──────────────────────────────────────────────────
const activeTabFields = computed(() =>
  getActiveTabFields(
    doc.value,
    fluxDef.value,
    tabs.value.find((t) => t.id === activeTab.value)!
  )
);

// ── Actions ───────────────────────────────────────────────────────────────────
const actionLoading = ref<string | null>(null);
const actionError = ref<string | null>(null);

const { mutateAsync: performAction } = useMutation({
  mutationFn: async (actionName: string) => {
    await $fetch(`/entite/${entiteId.value}/documents/perform_action`, {
      method: "POST",
      baseURL: config.public.apiBaseUrl,
      headers: { Authorization: `Bearer ${user.value?.accessToken}` },
      body: { document_ids: props.idD, action: actionName },
    });
  },
  onSuccess: (_, actionName) => {
    if (actionName === "supression") {
      router.push(`/`);
      return;
    }
    queryClient.invalidateQueries({
      queryKey: ["document", entiteId.value, props.idD],
    });
    queryClient.invalidateQueries({
      queryKey: ["journal", entiteId.value, props.idD],
    });
  },
});

async function runAction(action: { action: string; message: string }) {
  if (action.action === "modification") {
    router.push(
      `/org/${entiteId.value}/document/${props.idD}/edit?type=${props.fluxType ?? doc.value?.info?.type ?? ""}`
    );
    return;
  }

  actionLoading.value = action.action;
  actionError.value = null;
  const previousState = doc.value?.last_action;
  try {
    await performAction(action.action);
  } catch (e) {
    actionError.value =
      e?.data?.detail ?? e?.message ?? "Une erreur est survenue";
  } finally {
    actionLoading.value = null;
  }
}

const journalEntries = computed(() => journalData.value ?? []);

const journalUser = (entry: any) => {
  const name = [entry.prenom, entry.nom].filter(Boolean).join(" ");
  return name || "Action automatique";
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function downloadFile(filename: string, elementId: string) {
  const url = `/api/file/${entiteId.value}/${props.idD}/${elementId}/${encodeURIComponent(filename)}`;
  const a = window.document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

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
  <div class="max-w-4xl mx-auto px-4 py-6">
    <!-- Retour -->
    <button
      class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      @click="router.back()"
    >
      <i class="pi pi-arrow-left text-xs" />
      Retour à la liste
    </button>

    <div v-if="error" class="text-red-600 py-4">
      Erreur lors du chargement du document.
    </div>

    <!-- Skeleton chargement -->
    <div v-else-if="isPending" class="space-y-4">
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

    <template v-else-if="doc">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              {{ doc.info.titre || "Sans titre" }}
            </h1>
            <p class="text-sm text-gray-500 mt-1">{{ doc.info.type }}</p>
          </div>
        </div>
        <!-- Dates : skeleton tant que le fetch frais n'est pas terminé -->
        <div v-if="!doc?.info?.creation" class="flex gap-4 mt-3">
          <Skeleton width="8rem" height="0.75rem" />
          <Skeleton width="8rem" height="0.75rem" />
          <Skeleton width="9rem" height="0.75rem" />
        </div>
        <div v-else class="flex gap-6 mt-3 text-xs text-gray-400">
          <span>Créé le {{ formatDate(doc.info.creation) }}</span>
          <span>Modifié le {{ formatDate(doc.info.modification) }}</span>
          <span>Dernier état le {{ formatDate(doc.last_action_date) }}</span>
        </div>
      </div>

      <!-- Actions : skeleton tant que le fetch frais n'est pas terminé -->
      <div class="flex flex-wrap gap-2 mb-6">
        <template v-if="!doc?.info?.creation">
          <Skeleton width="6rem" height="2.25rem" border-radius="6px" />
          <Skeleton width="6rem" height="2.25rem" border-radius="6px" />
          <Skeleton width="9rem" height="2.25rem" border-radius="6px" />
        </template>
        <template v-else-if="doc.action_possible?.length">
          <Button
            v-for="action in doc.action_possible.filter(
              (a: any) =>
                a.message &&
                !(a.action === 'modification' && doc.last_action === 'termine')
            )"
            :key="action.action"
            :label="action.message"
            :icon="
              actionLoading === action.action
                ? 'pi pi-spinner pi-spin'
                : `pi ${actionIcon(action.action)}`
            "
            :severity="actionSeverity(action.action)"
            :disabled="!!actionLoading"
            @click="runAction(action)"
          />
        </template>
      </div>

      <!-- Bannière erreur formulaire : only si la partie avant ' : ' est un code action (sans espace) -->
      <div
        v-if="
          doc?.last_action_message && /^[^\s]+ : /.test(doc.last_action_message)
        "
        class="mb-4 text-sm text-red-700 bg-red-50 px-4 py-3 rounded border border-red-300 w-full"
      >
        {{ doc.last_action_message }}
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
          v-if="
            !Object.keys(fluxDef).length ||
            (isPending && !Object.keys(doc?.data ?? {}).length)
          "
          class="divide-y divide-gray-100"
        >
          <div v-for="i in 5" :key="i" class="flex px-4 py-3 even:bg-gray-50">
            <Skeleton width="33%" height="0.75rem" />
            <Skeleton width="50%" height="0.75rem" class="ml-8" />
          </div>
        </div>

        <template v-else>
          <table class="min-w-full text-sm">
            <tbody class="divide-y divide-gray-100">
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
            <Skeleton width="25%" height="0.75rem" />
            <Skeleton width="25%" height="0.75rem" />
            <Skeleton width="20%" height="0.75rem" />
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
              <th class="px-4 py-2 text-left font-medium text-gray-600">
                État
              </th>
              <th class="px-4 py-2 text-left font-medium text-gray-600">
                Date
              </th>
              <th class="px-4 py-2 text-left font-medium text-gray-600">
                Utilisateur
              </th>
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
              <td
                class="px-4 py-2 text-gray-600 tabular-nums whitespace-nowrap"
              >
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
