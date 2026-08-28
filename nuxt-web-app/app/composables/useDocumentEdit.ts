import type { FetchError } from "ofetch";

export async function useDocumentEdit(props: {
  entiteId: number;
  idD: string;
  fluxType?: string;
}) {
  const { data: user } = useAuth();
  const { getFluxDef, fluxDefFor } = useFluxDef();
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();

  const isNew = computed(() => props.idD === "new");
  const createdDocId = ref<string | null>(null);
  const formData = ref<FormData>({});
  const pendingFiles = ref<Record<string, File[]>>({});
  const fileError = ref<string | null>(null);

  // Formulaire en 2 étapes façon Angular : étape 1 = champs du flux, étape 2 = classification
  // des pièces (uniquement pour les flux TDT, càd ceux dont le flux Pastell définit "type_piece")
  const currentStep = ref(1);
  watch(
    () => props.idD,
    () => {
      currentStep.value = 1;
    }
  );

  // Évite de re-sauvegarder/recharger inutilement (et perdre les sélections en cours) quand
  // on fait Précédent puis Étape suivante sans rien avoir modifié.
  const step2Ready = ref(false);
  watch(
    formData,
    () => {
      step2Ready.value = false;
    },
    { deep: true }
  );
  watch(
    pendingFiles,
    () => {
      step2Ready.value = false;
    },
    { deep: true }
  );

  const docQueryKey = computed(() => ["document", props.entiteId, props.idD]);
  function docQueryFn() {
    if (isNew.value) return null;
    return apiFetch<DocumentDetail>(
      `/entite/${props.entiteId}/document/${props.idD}`,
      {
        query: props.fluxType ? { type_flux: props.fluxType } : undefined,
      }
    );
  }

  const { data: doc, isPending } = useQuery({
    queryKey: docQueryKey,
    queryFn: docQueryFn,
    enabled: computed(() => !isNew.value && !!user.value?.accessToken),
    staleTime: 30000,
    placeholderData: (prev) => prev,
    retry: shouldRetry,
  });

  const fluxDef = computed(() => {
    const type = props.fluxType ?? doc.value?.info?.type;
    return type ? fluxDefFor(type) : {};
  });

  // Comme côté Angular (getFieldTdt) : un flux a une étape TDT si son flux Pastell
  // définit un champ "type_piece" (classification des pièces avant télétransmission).
  const hasStepTdt = computed(() => !!fluxDef.value["type_piece"]);

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

  const tabs = computed(() => {
    const type = props.fluxType ?? doc.value?.info?.type ?? "";
    const data = doc.value?.data ?? {};
    const configTabs = FLUX_TABS_CONFIG[type] ?? [];

    const filtered = configTabs
      .filter((tab) => !tab.condition || tab.condition(data))
      .map((tab) => {
        const override = FORM_TAB_FIELD_OVERRIDES[tab.id];
        const fields = override?.[type] ?? override?.["default"] ?? tab.fields;
        return { ...tab, fields };
      });

    // Comme dans la vue détail (DocumentDetail.vue) : "Acte" est fusionné dans
    // "Préparer" pour alléger l'affichage (moins d'onglets à parcourir pour un même acte).
    const acteTab = filtered.find((t) => t.id === "acte");
    if (!acteTab) return filtered;
    return filtered
      .filter((t) => t.id !== "acte")
      .map((t) =>
        t.id === "preparer"
          ? {
              ...t,
              fields: [...t.fields, ...acteTab.fields],
              alwaysShow: [
                ...(t.alwaysShow ?? []),
                ...(acteTab.alwaysShow ?? []),
              ],
            }
          : t
      );
  });

  function resolveTabFields(fields: string[]) {
    return fields
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
            (key === "envoi_depot" &&
              props.fluxType === "autres-studio-sans-tdt"),
        };
      })
      .filter(Boolean);
  }

  // Sections empilées sans onglets cliquables (DocumentForm.vue) : un champ requis resté
  // vide sur un onglet jamais visité passait inaperçu jusqu'au clic sur Enregistrer.
  const sections = computed(() =>
    tabs.value.map((tab) => ({
      id: tab.id,
      label: tab.label,
      fields: resolveTabFields(tab.fields),
    }))
  );

  // Recopie les données du document existant dans formData (une seule fois). Le fallback
  // sur le cache couvre l'appel SSR, où doc.value peut ne pas encore refléter le prefetch.
  function seedFormDataFromDoc() {
    const d =
      doc.value ?? queryClient.getQueryData<DocumentDetail>(docQueryKey.value);
    if (d?.data && !Object.keys(formData.value).length) {
      formData.value = { ...d.data };
    }
  }

  // Valeurs par défaut du formulaire de création (nécessite fluxDef chargé).
  function applyCreationDefaults() {
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
  }

  watch(doc, seedFormDataFromDoc, { immediate: true });
  watch(fluxDef, applyCreationDefaults, { immediate: true });

  function onFileChange(key: string, event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const newFiles = Array.from(input.files);
    fileError.value = null;

    // Champ multiple (Annexes) : cumule avec la sélection déjà en attente plutôt que
    // l'écraser, sinon choisir en plusieurs fois perdait les fichiers précédents.
    const isMultiple = fluxDef.value[key]?.multiple;
    const currentFieldFiles = isMultiple ? (pendingFiles.value[key] ?? []) : [];

    // Un même fichier ne doit pas pouvoir être déposé 2x (Acte+Annexe ou 2x Annexe) : on
    // compare par nom à tout ce qui est déjà en attente, sur ce champ et les autres.
    const alreadyPending = Object.entries(pendingFiles.value)
      .filter(([k]) => k !== key)
      .flatMap(([, files]) => files)
      .concat(currentFieldFiles);

    const accepted: File[] = [];
    let duplicateName: string | null = null;
    for (const file of newFiles) {
      const name = file.name.trim().toLowerCase();
      const isDuplicate =
        alreadyPending.some((f) => f.name.trim().toLowerCase() === name) ||
        accepted.some((f) => f.name.trim().toLowerCase() === name);
      if (isDuplicate) {
        duplicateName = file.name;
        continue;
      }
      accepted.push(file);
    }

    if (duplicateName) {
      fileError.value = `Le fichier « ${duplicateName} » est déjà déposé (acte ou annexe) : merci de ne pas télétransmettre 2 fois le même document.`;
    }

    if (accepted.length) {
      pendingFiles.value[key] = isMultiple
        ? [...currentFieldFiles, ...accepted]
        : accepted;
    }

    // Permet de re-choisir le(s) même(s) fichier(s) après un retrait, le navigateur ne
    // déclenchant pas "change" si la sélection est identique à la précédente.
    input.value = "";
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

  const externalDataCache = ref<Record<string, Record<string, boolean>>>({});
  const externalDataLoading = ref<string | null>(null);
  const showExternalDialog = ref(false);
  const externalDialogField = ref("");
  const externalDialogLabel = ref("");
  const externalDialogSearch = ref("");
  const externalDialogTemp = ref<string[]>([]);

  const typePieceTypesList = ref<Record<string, string>>({});
  const typePieceItems = ref<{ piece: string; label: string }[]>([]);
  const typePieceLoading = ref(false);

  const filteredExternalOptions = computed(() => {
    const vals = externalDataCache.value[externalDialogField.value] ?? {};
    const keys = Object.keys(vals);
    const q = externalDialogSearch.value.trim().toLowerCase();
    return q ? keys.filter((k) => k.toLowerCase().includes(q)) : keys;
  });

  // Métadonnée de flux indépendante des fichiers du document : peut tourner en parallèle
  // du PATCH/upload de l'étape 1 plutôt que d'attendre leur fin.
  async function fetchTypePieceMeta(): Promise<
    { ok: true; data: TypePieceMeta } | { ok: false; error: string }
  > {
    typePieceLoading.value = true;
    try {
      const docId = createdDocId.value ?? (!isNew.value ? props.idD : null);
      const url = docId
        ? `/entite/${props.entiteId}/document/${docId}/externalData/type_piece`
        : `/entite/${props.entiteId}/flux/${props.fluxType ?? ""}/externalData/type_piece`;
      const data = await apiFetch<TypePieceMeta>(url);
      return { ok: true, data };
    } catch (e) {
      const err = e as FetchError;
      const status = err?.status ?? err?.response?.status;
      if (status === 400) {
        const hasPending = Object.values(pendingFiles.value).some(
          (f) => f.length > 0
        );
        return {
          ok: false,
          error: hasPending
            ? "Enregistrez d'abord le document pour téléverser le fichier acte, puis sélectionnez les types de pièces."
            : "Veuillez d'abord téléverser un fichier acte avant de définir les types de pièces.",
        };
      }
      return {
        ok: false,
        error:
          err?.data?.detail ??
          err?.message ??
          "Impossible de charger les types de pièces",
      };
    } finally {
      typePieceLoading.value = false;
    }
  }

  // Construit typePieceItems à partir de la métadonnée (fetchTypePieceMeta) + de l'état local
  // (purement synchrone, aucun appel réseau) : à appeler une fois les uploads de l'étape 1 terminés.
  function buildTypePieceItems(data: TypePieceMeta) {
    // Sans docId, le nombre de pièces renvoyé par le serveur vient d'un autre document du
    // même flux (emprunté par le backend) : on reconstruit la liste depuis le formulaire.
    const localPieces = buildLocalPieces();
    const rawPieces = localPieces.length ? localPieces : (data.pieces ?? []);
    typePieceTypesList.value = data.actes_type_pj_list ?? {};

    const codeToLabel = typePieceTypesList.value;
    const labelSet = new Set(Object.values(codeToLabel));
    const current = formData.value["type_piece"];
    const currentArr = Array.isArray(current)
      ? current
      : current
        ? [current]
        : [];

    typePieceItems.value = rawPieces.map(
      (p: string | { filename: string; type_pj?: string }, i: number) => {
        const piece = typeof p === "string" ? p : (p.filename ?? String(p));
        const raw =
          typeof p === "object" && p.type_pj
            ? p.type_pj
            : (currentArr[i] ?? "");
        const label = labelSet.has(raw) ? raw : (codeToLabel[raw] ?? "");
        return { piece, label };
      }
    );
    step2Ready.value = true;
  }

  async function openExternalDialog(
    fieldKey: string,
    fieldLabel: string,
    onError?: (msg: string) => void
  ) {
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
        const data = await apiFetch<Record<string, boolean>>(externalDataUrl, {
          query:
            docId && props.fluxType ? { type_flux: props.fluxType } : undefined,
        });
        externalDataCache.value[fieldKey] = data;
      } catch (e) {
        const err = e as FetchError;
        onError?.(
          err?.data?.detail ??
            err?.message ??
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

  function toggleExternalOption(option: string) {
    formData.value[externalDialogField.value] = option;
    showExternalDialog.value = false;
  }

  function externalDisplayValue(key: string): string {
    const val = formData.value[key];
    if (!val) return "";
    return Array.isArray(val) ? val.join(", ") : String(val);
  }

  // Prefetch bloquant SSR (comme DocumentDetail.vue) : sans lui, formulaire vide jusqu'à
  // l'hydratation malgré ssr: true — capté par le <Suspense> racine autour de <NuxtPage>.
  // Doit rester APRÈS les ref/computed/watch ci-dessus (composable classique, pas <script
  // setup>) : un effet déclaré après un await perd son scope Vue — a déjà cassé le SSR.
  if (import.meta.server && !isNew.value && user.value?.accessToken) {
    await queryClient.prefetchQuery({
      queryKey: docQueryKey.value,
      queryFn: docQueryFn,
      staleTime: 30000,
    });
  }
  if (import.meta.server && user.value?.accessToken) {
    const cachedDoc = queryClient.getQueryData<DocumentDetail>(
      docQueryKey.value
    );
    const effectiveType = props.fluxType ?? cachedDoc?.info?.type;
    if (effectiveType) await getFluxDef(effectiveType);
    // Les watchers ci-dessus ne se redéclenchent pas après leur appel immédiat en SSR :
    // doc et fluxDef ne sont prêts qu'ici (après les await). On applique donc à la main
    // ce que le client posera à l'hydratation, sinon mismatch sur les champs seedés
    // (données du doc) et les valeurs par défaut du formulaire de création.
    seedFormDataFromDoc();
    applyCreationDefaults();
  }

  return {
    doc,
    isPending,
    isNew,
    createdDocId,
    fluxDef,
    hasStepTdt,
    currentStep,
    step2Ready,
    tabs,
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
    fetchTypePieceMeta,
    buildTypePieceItems,
    openExternalDialog,
    toggleExternalOption,
    externalDisplayValue,
  };
}
