// ── Champs d'un onglet ────────────────────────────────────────────────────────
export function getTabFields(document: DocumentInfo, fluxDef: FluxDetails, tab: { id: string; fields: string[] }) {
  if (!document.data) return [];

  // Si pas de config pour ce flux, fallback sur filterFields
  const fluxType = document.info?.type;
  if (!TABS_CONFIG[fluxType] && tab.id === "preparer") {
    return getFilteredFields(fluxDef);
  }

  return tab.fields
    .map((key) => {
      const def = fluxDef[key];
      const val = document.data[key];
      if (val === undefined || val === null || val === "" || val === "[]")
        return null;
      if (Array.isArray(val) && val.length === 0) return null;
      return {
        key,
        val,
        label: def?.name ?? key.replace(/_/g, " "),
        type: def?.type ?? "text",
        selectValues: def?.value ?? null,
        commentaire: def?.commentaire ?? null,
      };
    })
    .filter(Boolean);
}

// filterFields pour flux sans config
function getFilteredFields(fluxDef: FluxDetails) {
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

