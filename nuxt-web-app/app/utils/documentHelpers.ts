// ── Champs d'un onglet ────────────────────────────────────────────────────────
export function getActiveTabFields(
  document: DocumentDetail | null | undefined,
  fluxDef: FluxDetails | null | undefined,
  tab: TabConfig
) {
  if (!document || !fluxDef || !document.data) return [];

  // Si pas de config pour ce flux, fallback sur filterFields
  const fluxType = document.info?.type;
  if (!FLUX_TABS_CONFIG[fluxType] && tab.id === "preparer") {
    return getFilteredFields(document, fluxDef);
  }

  const alwaysShow = new Set(tab.alwaysShow ?? []);
  return tab.fields
    .map((key) => {
      const def = fluxDef[key];
      const val = document.data[key];
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
}

// filterFields pour flux sans config
function getFilteredFields(document: DocumentInfo, fluxDef: FluxDetails) {
  return Object.entries(fluxDef)
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
      val: document.data[key] ?? null,
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
        !(Array.isArray(val) && val.length === 0)
    );
}
