import type { FetchOptions } from "ofetch";

export function useDocumentEdit(props: {
  entiteId: number;
  idD: string;
  fluxType?: string;
}) {
  const config = useRuntimeConfig();
  const { data: user } = useAuth();
  const authHeaders = computed(() => ({
    Authorization: `Bearer ${user.value?.accessToken}`,
  }));
  const { getFluxDef, fluxDefFor } = useFluxDef();

  const isNew = computed(() => props.idD === "new");
  const createdDocId = ref<string | null>(null);
  const activeTab = ref("preparer");
  const formData = ref<FormData | null>(null);
  const pendingFiles = ref<Record<string, File[]> | null>(null);

  const { data: doc, isPending } = useQuery({
    queryKey: computed(() => ["document", props.entiteId, props.idD]),
    queryFn: async () => {
      if (isNew.value) return null;
      return await $fetch<DocumentDetail>(
        `/entite/${props.entiteId}/document/${props.idD}`,
        {
          baseURL: config.public.apiBaseUrl,
          headers: authHeaders.value,
          query: props.fluxType ? { type_flux: props.fluxType } : undefined,
        }
      );
    },
    enabled: computed(() => !isNew.value && !!user.value?.accessToken),
    staleTime: 30000,
    placeholderData: (prev) => prev,
    // Pas de retry sur 4xx (erreur définitive, pas transitoire)
    retry: (failureCount, error) => {
      const status = error?.status ?? error?.response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 1;
    },
  });

  const fluxDef = computed(() => {
    const type = props.fluxType ?? doc.value?.info?.type;
    return type ? fluxDefFor(type) : {};
  });

  watch(
    () => ({
      token: user.value?.accessToken,
      type: props.fluxType ?? doc.value?.info?.type,
    }),
    async ({ token, type }) => {
      if (token && type) await getFluxDef(type);
    },
    { immediate: true }
  );

  // construction dynamique du formulaire (Onglets & Champs)

  const tabs = computed(() => {
    const type = props.fluxType ?? doc.value?.info?.type ?? "";
    const data = doc.value?.data ?? {};
    const configTabs =
      (typeof FLUX_TABS_CONFIG !== "undefined" ? FLUX_TABS_CONFIG[type] : []) ??
      [];

    return configTabs
      .filter((tab) => !tab.condition || tab.condition(data))
      .map((tab) => {
        const override = FORM_TAB_FIELD_OVERRIDES[tab.id];
        const fields = override?.[type] ?? override?.["default"] ?? tab.fields;
        return { ...tab, fields };
      });
  });

  const tabFields = computed(() => {
    const tab = tabs.value.find((t) => t.id === activeTab.value);
    if (!tab) return [];
    return tab.fields
      .map((key: string) => {
        const def = fluxDef.value[key];
        if (!def || def["no-show"]) return null;
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

  watch(
    doc,
    (d) => {
      if (d?.data && !Object.keys(formData.value).length) {
        formData.value = { ...d.data };
      }
    },
    { immediate: true }
  );

  watch(
    fluxDef,
    () => {
      if (!isNew.value || !Object.keys(fluxDef.value).length) return;
      const type = props.fluxType ?? "";

      if (!formData.value.acte_nature) {
        const options = fluxDef.value.acte_nature?.value as
          | Record<string, string>
          | undefined;
        if (options) formData.value.acte_nature = Object.keys(options)[0];
      }
      if (!formData.value.date_de_lacte)
        formData.value.date_de_lacte = todayISO();

      const defaults = FORM_DEFAULTS[type] ?? {};
      for (const [key, val] of Object.entries(defaults)) {
        if (!formData.value[key]) formData.value[key] = val;
      }
    },
    { immediate: true }
  );

  function onFileChange(key: string, event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) pendingFiles.value[key] = Array.from(input.files);
  }

  function removeFile(key: string, file: File) {
    pendingFiles.value[key] = pendingFiles.value[key].filter((f) => f !== file);
  }

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

  async function fetchWithRefresh<T>(
    url: string,
    opts?: FetchOptions
  ): Promise<T> {
    try {
      return await $fetch<T>(url, {
        baseURL: config.public.apiBaseUrl,
        headers: authHeaders.value,
        ...opts,
      });
    } catch (e) {
      if (e?.status === 403 || e?.response?.status === 403) {
        const newToken = await tryRefreshToken();
        if (newToken)
          return await $fetch<T>(url, {
            baseURL: config.public.apiBaseUrl,
            headers: { Authorization: `Bearer ${newToken}` },
            ...opts,
          });
      }
      throw e;
    }
  }

  const externalDataCache = ref<Record<string, Record<string, boolean>>>({});
  const externalDataLoading = ref<string | null>(null);
  const showExternalDialog = ref(false);
  const externalDialogField = ref("");
  const externalDialogLabel = ref("");
  const externalDialogSearch = ref("");
  const externalDialogTemp = ref<string[]>([]);

  const showTypePieceDialog = ref(false);
  const typePieceTypesList = ref<Record<string, string>>({});
  const typePieceItems = ref<{ piece: string; label: string }[]>([]);

  const filteredExternalOptions = computed(() => {
    const vals = externalDataCache.value[externalDialogField.value] ?? {};
    const keys = Object.keys(vals);
    const q = externalDialogSearch.value.trim().toLowerCase();
    return q ? keys.filter((k) => k.toLowerCase().includes(q)) : keys;
  });

  async function openExternalDialog(
    fieldKey: string,
    fieldLabel: string,
    onError?: (msg: string) => void
  ) {
    if (fieldKey === "type_piece") {
      externalDataLoading.value = fieldKey;
      try {
        const docId = createdDocId.value ?? (!isNew.value ? props.idD : null);
        const url = docId
          ? `/entite/${props.entiteId}/document/${docId}/externalData/type_piece`
          : `/entite/${props.entiteId}/flux/${props.fluxType ?? ""}/externalData/type_piece`;
        const data = await fetchWithRefresh(url, { retry: 0 });

        // Le nombre de pièces renvoyé par le serveur peut être erroné : sans docId,
        // il provient d'un autre document du même flux (emprunté par le backend) et
        // ne reflète pas les fichiers réellement attachés localement (pas encore envoyés).
        // On reconstruit donc la liste des pièces à partir des fichiers du formulaire.
        const localPieces = buildLocalPieces();
        const rawPieces = localPieces.length
          ? localPieces
          : (data.pieces ?? []);
        typePieceTypesList.value = data.actes_type_pj_list ?? {};

        const codeToLabel = typePieceTypesList.value;
        const labelSet = new Set(Object.values(codeToLabel));
        const current = formData.value["type_piece"];
        const currentArr = Array.isArray(current)
          ? current
          : current
            ? [current]
            : [];

        typePieceItems.value = rawPieces.map((p, i) => {
          const piece = typeof p === "string" ? p : (p.filename ?? String(p));
          const raw =
            typeof p === "object" && p.type_pj
              ? p.type_pj
              : (currentArr[i] ?? "");
          const label = labelSet.has(raw) ? raw : (codeToLabel[raw] ?? "");
          return { piece, label };
        });

        showTypePieceDialog.value = true;
      } catch (e) {
        const status = e?.status ?? e?.response?.status;
        if (status === 400) {
          const hasPending = Object.values(pendingFiles.value).some(
            (f) => f.length > 0
          );
          onError?.(
            hasPending
              ? "Enregistrez d'abord le document pour téléverser le fichier acte, puis sélectionnez les types de pièces."
              : "Veuillez d'abord téléverser un fichier acte avant de définir les types de pièces."
          );
        } else {
          onError?.(
            e?.data?.detail ??
              e?.message ??
              "Impossible de charger les types de pièces"
          );
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

    if (!externalDataCache.value[fieldKey]) {
      externalDataLoading.value = fieldKey;
      try {
        const docId = createdDocId.value ?? (!isNew.value ? props.idD : null);
        const externalDataUrl = docId
          ? `/entite/${props.entiteId}/document/${docId}/externalData/${fieldKey}`
          : `/entite/${props.entiteId}/flux/${props.fluxType ?? ""}/externalData/${fieldKey}`;
        // type_flux : permet au backend de réutiliser le cache par type de flux
        const data = await $fetch<Record<string, boolean>>(externalDataUrl, {
          baseURL: config.public.apiBaseUrl,
          headers: authHeaders.value,
          query:
            docId && props.fluxType ? { type_flux: props.fluxType } : undefined,
        });
        externalDataCache.value[fieldKey] = data;
      } catch (e) {
        onError?.(
          e?.data?.detail ??
            e?.message ??
            `Impossible de charger les options pour « ${fieldLabel} »`
        );
        externalDataLoading.value = null;
        return;
      } finally {
        externalDataLoading.value = null;
      }
    }

    showExternalDialog.value = true;
  }

  function confirmTypePieceSelection() {
    formData.value["type_piece"] = typePieceItems.value.map(
      (item) => item.label
    );
    showTypePieceDialog.value = false;
  }

  function toggleExternalOption(option: string) {
    formData.value[externalDialogField.value] = option;
    showExternalDialog.value = false;
  }

  function externalDisplayValue(key: string): string {
    const val = formData.value[key];
    if (!val) return "";
    return Array.isArray(val) ? val.join(", ") : String(val);
  }

  return {
    doc,
    isPending,
    isNew,
    createdDocId,
    fluxDef,
    tabs,
    activeTab,
    tabFields,
    formData,
    pendingFiles,
    onFileChange,
    removeFile,
    buildLocalPieces,
    fetchWithRefresh,
    externalDataLoading,
    showExternalDialog,
    externalDialogLabel,
    externalDialogSearch,
    externalDialogTemp,
    filteredExternalOptions,
    showTypePieceDialog,
    typePieceTypesList,
    typePieceItems,
    openExternalDialog,
    confirmTypePieceSelection,
    toggleExternalOption,
    externalDisplayValue,
  };
}
