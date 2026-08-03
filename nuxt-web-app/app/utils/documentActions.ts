export const BATCH_ACTION_CONFIG: Record<
  string,
  { icon: string; severity: string }
> = {
  modification: { icon: "pi pi-pencil", severity: "secondary" },
  supression: { icon: "pi pi-trash", severity: "danger" },
  orientation: { icon: "pi pi-send", severity: "secondary" },
  "teletransmission-tdt": { icon: "pi pi-share-alt", severity: "secondary" },
  duplicate: { icon: "pi pi-copy", severity: "secondary" },
  "verif-tdt": { icon: "pi pi-search", severity: "secondary" },
  reouverture: { icon: "pi pi-refresh", severity: "secondary" },
  "annulation-tdt": { icon: "pi pi-times", severity: "danger" },
  "generate-sip": { icon: "pi pi-box", severity: "secondary" },
  "send-archive": { icon: "pi pi-cloud-upload", severity: "secondary" },
};

export function batchActionIcon(action: string) {
  return BATCH_ACTION_CONFIG[action]?.icon ?? "pi pi-info-circle";
}

export function batchActionSeverity(action: string) {
  return BATCH_ACTION_CONFIG[action]?.severity ?? "secondary";
}

export function isBatchable(a: { action: string; message?: string }) {
  // "orientation" (Envoyer) dépend de l'état réel du document (champs remplis, etc.), pas
  // seulement de last_action : action_possible de la liste n'est qu'une estimation pour cet
  // état, pas fiable à 100%. On l'exclut donc du groupé (le vrai check a lieu à l'exécution
  // et peut refuser un document malgré l'estimation) ; la fiche détail, elle, reste fiable.
  return (
    !!a.message && a.action !== "modification" && a.action !== "orientation"
  );
}

export function hasAction(
  doc: { action_possible?: { action: string }[] },
  action: string
) {
  return doc.action_possible?.some((a) => a.action === action) ?? false;
}

// "duplicate" n'est pas une vraie action Pastell : dispo pour tout document sauf en
// cours de création, sauf pour les flux où la duplication n'a pas de sens métier.
const FLUX_WITHOUT_DUPLICATE = ["autres-studio-sans-tdt"];

export function canDuplicate(doc: { type?: string; last_action?: string }) {
  return (
    doc.last_action !== "creation" &&
    !FLUX_WITHOUT_DUPLICATE.includes(doc.type ?? "")
  );
}
