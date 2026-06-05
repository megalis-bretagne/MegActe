<script setup lang="ts">
const props = defineProps<{
  entiteId: number;
  idD: string;
}>();

const config = useRuntimeConfig();
const router = useRouter();
const { user } = useUserContext();

const headers = computed(() => ({ Authorization: `Bearer ${user.value?.token}` }));

// ── Fetch document ────────────────────────────────────────────────────────────
const document = ref<any>(null);
const pending = ref(true);
const error = ref<any>(null);

async function fetchDocument() {
  if (!user.value?.token) return;
  pending.value = true;
  error.value = null;
  try {
    document.value = await $fetch<any>(`/entite/${props.entiteId}/document/${props.idD}`, {
      baseURL: config.public.apiBaseUrl,
      headers: headers.value,
    });
  } catch (e: any) {
    error.value = e;
  } finally {
    pending.value = false;
  }
}

async function refresh() {
  await fetchDocument();
}

watch(() => user.value?.token, (token) => {
  if (token) fetchDocument();
}, { immediate: true });

const fluxDef = ref<any>({});
watch(document, async (doc) => {
  if (!doc?.info?.type) return;
  try {
    fluxDef.value = await $fetch<any>(`/flux/${doc.info.type}`, {
      baseURL: config.public.apiBaseUrl,
      headers: headers.value,
    });
  } catch { fluxDef.value = {}; }
}, { immediate: true });

// ── Définition des onglets par flux ──────────────────────────────────────────
// Champs par onglet pour deliberations-studio
const TABS_CONFIG: Record<string, { id: string; label: string; fields: string[] }[]> = {
  'deliberations-studio': [
    {
      id: 'preparer',
      label: 'Préparer',
      fields: [
        'acte_nature', 'numero_de_lacte', 'objet', 'arrete',
        'autre_document_attache', 'publication_open_data', 'date_de_lacte',
        'classification', 'type_piece_fichier',
      ],
    },
    {
      id: 'cheminement',
      label: 'Cheminement',
      fields: ['envoi_tdt_actes', 'envoi_depot', 'envoi_sae', 'document_papier'],
    },
    {
      id: 'acte',
      label: 'Acte',
      fields: [
        'tedetis_transaction_id', 'bordereau', 'aractes', 'acte_tamponne',
        'annexes_tamponnees', 'date_ar', 'acte_unique_id', 'acte_publication_date',
        'reponse_prefecture_file',
      ],
    },
    {
      id: 'retour-tdt',
      label: 'Retour Tdt',
      fields: [
        'tedetis_annulation_id', 'aractes_annulation', 'date_ar_annulation',
      ],
    },
    {
      id: 'retour-ged',
      label: 'Retour GED',
      fields: ['ged_document_id_file'],
    },
    {
      id: 'sae',
      label: 'SAE',
      fields: [
        'sae_transfert_id', 'sae_bordereau', 'sae_archive', 'ar_sae',
        'sae_ack_comment', 'reply_sae', 'sae_atr_comment',
        'sae_archival_identifier', 'url_archive', 'journal',
        'date_journal_debut', 'date_cloture_journal',
      ],
    },
  ],
};

// Onglets disponibles selon le type de flux
const tabs = computed(() => {
  const fluxType = document.value?.info?.type;
  return TABS_CONFIG[fluxType] ?? [{ id: 'preparer', label: 'Préparer', fields: [] }];
});

const activeTab = ref('preparer');

// Reset onglet actif quand le flux change
watch(tabs, () => { activeTab.value = 'preparer'; });

// ── Champs d'un onglet ────────────────────────────────────────────────────────
function getTabFields(tab: { id: string; fields: string[] }) {
  if (!document.value?.data) return [];

  // Si pas de config pour ce flux, fallback sur filterFields
  const fluxType = document.value?.info?.type;
  if (!TABS_CONFIG[fluxType] && tab.id === 'preparer') {
    return getFilteredFields();
  }

  return tab.fields
      .map(key => {
        const def = fluxDef.value[key];
        const val = document.value.data[key];
        if (val === undefined || val === null || val === '' || val === '[]') return null;
        if (Array.isArray(val) && val.length === 0) return null;
        return {
          key,
          val,
          label: def?.name ?? key.replace(/_/g, ' '),
          type: def?.type ?? 'text',
          selectValues: def?.value ?? null,
          commentaire: def?.commentaire ?? null,
        };
      })
      .filter(Boolean);
}

// filterFields pour flux sans config
function getFilteredFields() {
  return Object.entries(fluxDef.value)
      .filter(([key, def]: [string, any]) => {
        if (def?.['no-show']) return false;
        if (!def?.type) return false;
        if (def?.requis) {
          if (def.type === 'file' && def['read-only']) return false;
          return true;
        }
        if (def?.['read-only'] === true) return false;
        if ((def?.type === 'date' || def?.type === 'file') && !def?.commentaire) return false;
        return true;
      })
      .filter(([key]) => key !== 'type_piece')
      .map(([key, def]: [string, any]) => ({
        key,
        val: document.value.data[key] ?? null,
        label: def?.name ?? key.replace(/_/g, ' '),
        type: def?.type ?? 'text',
        selectValues: def?.value ?? null,
        commentaire: def?.commentaire ?? null,
      }))
      .filter(({ val }) => val !== null && val !== '' && val !== '[]' &&
          !(Array.isArray(val) && val.length === 0));
}

// ── Actions ───────────────────────────────────────────────────────────────────
const actionLoading = ref<string | null>(null);
const actionError = ref<string | null>(null);

async function runAction(action: { action: string; message: string }) {
  actionLoading.value = action.action;
  actionError.value = null;
  try {
    await $fetch(`/entite/${props.entiteId}/documents/perform_action`, {
      method: 'POST',
      baseURL: config.public.apiBaseUrl,
      headers: headers.value,
      body: { document_ids: props.idD, action: action.action },
    });
    await refresh();
  } catch (e: any) {
    actionError.value = e?.message ?? 'Une erreur est survenue';
  } finally {
    actionLoading.value = null;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (d: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const fileUrl = (filename: string, elementId: string) =>
    `${config.public.apiBaseUrl}/entite/${props.entiteId}/document/${props.idD}/file/${elementId}/${filename}`;

const isFileArray = (val: any) =>
    Array.isArray(val) && val.length > 0 && typeof val[0] === 'string' && val[0].includes('.');

const resolveSelectValue = (field: any) => {
  if (!field.selectValues) return field.val;
  return field.selectValues[field.val] ?? field.val;
};

const ACTION_COLORS: Record<string, string> = {
  modification: 'bg-blue-600 hover:bg-blue-700 text-white',
  supression: 'bg-red-600 hover:bg-red-700 text-white',
};
const actionColor = (action: string) =>
    ACTION_COLORS[action] ?? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300';
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-6">

    <!-- Retour -->
    <button
        class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        @click="router.back()"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Retour à la liste
    </button>

    <!-- Loading -->
    <div v-if="pending" class="space-y-4">
      <div class="h-8 w-64 bg-gray-200 rounded animate-pulse" />
      <div class="h-4 w-40 bg-gray-100 rounded animate-pulse" />
      <div class="mt-6 space-y-2">
        <div v-for="i in 8" :key="i" class="h-10 bg-gray-100 rounded animate-pulse" />
      </div>
    </div>

    <div v-else-if="error" class="text-red-600 py-4">Erreur lors du chargement du document.</div>

    <template v-else-if="document">

      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              {{ document.info.titre || 'Sans titre' }}
            </h1>
            <p class="text-sm text-gray-500 mt-1">{{ document.info.type }}</p>
          </div>
          <span class="shrink-0 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100">
            {{ document.last_action_message || document.last_action || '—' }}
          </span>
        </div>
        <div class="flex gap-6 mt-3 text-xs text-gray-400">
          <span>Créé le {{ formatDate(document.info.creation) }}</span>
          <span>Modifié le {{ formatDate(document.info.modification) }}</span>
          <span>Dernier état le {{ formatDate(document.last_action_date) }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div v-if="document.action_possible?.length" class="flex flex-wrap gap-2 mb-6">
        <button
            v-for="action in document.action_possible.filter((a: any) => a.message)"
            :key="action.action"
            :disabled="!!actionLoading"
            :class="actionColor(action.action)"
            class="inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
            @click="runAction(action)"
        >
          <svg v-if="actionLoading === action.action" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          {{ action.message }}
        </button>
      </div>

      <div v-if="actionError" class="mb-4 text-sm text-red-600 bg-red-50 px-4 py-2 rounded border border-red-200">
        {{ actionError }}
      </div>

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

      <!-- Contenu onglet actif -->
      <div class="rounded-b-lg rounded-tr-lg border border-t-0 border-gray-200 overflow-hidden">

        <!-- Skeleton flux pas encore chargé -->
        <div v-if="!Object.keys(fluxDef).length" class="divide-y divide-gray-100">
          <div v-for="i in 5" :key="i" class="flex px-4 py-3 even:bg-gray-50">
            <div class="w-1/3 h-3 bg-gray-200 rounded animate-pulse" />
            <div class="w-1/2 h-3 bg-gray-100 rounded animate-pulse ml-8" />
          </div>
        </div>

        <template v-else>
          <table class="min-w-full text-sm">
            <tbody class="divide-y divide-gray-100">
            <tr v-if="getTabFields(tabs.find(t => t.id === activeTab)!).length === 0">
              <td colspan="2" class="px-4 py-6 text-center text-gray-400 italic">Aucun champ disponible</td>
            </tr>
            <tr
                v-for="field in getTabFields(tabs.find(t => t.id === activeTab)!)"
                :key="field.key"
                class="even:bg-gray-50"
            >
              <td class="px-4 py-3 font-medium text-gray-600 w-1/3 align-top whitespace-nowrap">
                {{ field.label }}
                <span v-if="field.commentaire" class="block text-xs text-gray-400 font-normal max-w-xs whitespace-normal mt-0.5">
                    {{ field.commentaire.replace(/<[^>]*>/g, '') }}
                  </span>
              </td>
              <td class="px-4 py-3 text-gray-800">

                <!-- type_piece_fichier -->
                <template v-if="field.key === 'type_piece_fichier'">
                  <div v-for="(piece, i) in (field.val as any[])" :key="i" class="mb-1">
                    <a :href="fileUrl(piece.filename, 'arrete')" target="_blank" class="text-blue-600 hover:underline">
                      {{ piece.filename }}
                    </a>
                    <span class="text-gray-400 ml-2 text-xs">{{ piece.typologie }}</span>
                  </div>
                </template>

                <!-- Fichiers -->
                <template v-else-if="field.type === 'file' || isFileArray(field.val)">
                  <div v-for="(filename, i) in (field.val as string[])" :key="i" class="mb-1">
                    <a :href="fileUrl(filename, field.key)" target="_blank" class="text-blue-600 hover:underline">
                      {{ filename }}
                    </a>
                  </div>
                </template>

                <!-- Select -->
                <template v-else-if="field.type === 'select'">
                  {{ resolveSelectValue(field) }}
                </template>

                <!-- Checkbox -->
                <template v-else-if="field.type === 'checkbox'">
                    <span :class="field.val === 'checked' ? 'text-green-600' : 'text-gray-400'">
                      {{ field.val === 'checked' ? '✓ Oui' : 'Non' }}
                    </span>
                </template>

                <!-- Date ISO -->
                <template v-else-if="field.type === 'date' && typeof field.val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(field.val)">
                  {{ new Date(field.val).toLocaleDateString('fr-FR') }}
                </template>

                <!-- URL -->
                <template v-else-if="typeof field.val === 'string' && field.val.startsWith('http')">
                  <a :href="field.val" target="_blank" class="text-blue-600 hover:underline">{{ field.val }}</a>
                </template>

                <!-- Texte multilignes -->
                <template v-else-if="typeof field.val === 'string' && field.val.includes('\n')">
                  <p class="whitespace-pre-line text-sm text-gray-600">{{ field.val }}</p>
                </template>

                <!-- Valeur simple -->
                <template v-else>
                  {{ Array.isArray(field.val) ? field.val.join(', ') : field.val }}
                </template>

              </td>
            </tr>
            </tbody>
          </table>
        </template>
      </div>

    </template>
  </div>
</template>