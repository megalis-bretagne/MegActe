export interface StatusBadge {
  severity: "success" | "warn" | "danger" | "secondary";
  label: string;
}

// Pastell n'expose pas de code "état retour TDT" sur la liste : statut déduit des actions
// déjà chargées (pas d'appel supplémentaire), en attendant les vrais codes de l'équipe.
export function tdtStatus(doc: DocumentInfo): StatusBadge {
  if (hasAction(doc, "annulation-tdt")) {
    return { severity: "success", label: "Envoyé au TDT" };
  }
  if (hasAction(doc, "verif-tdt")) {
    return { severity: "warn", label: "Envoi en cours" };
  }
  const message =
    `${doc.last_action ?? ""} ${doc.last_action_message ?? ""}`.toLowerCase();
  if (/erreur|echec|échec|rejet/.test(message)) {
    return { severity: "danger", label: "Erreur d'envoi" };
  }
  return { severity: "secondary", label: "Non transmis" };
}

// Pas de statut de publication : publication_open_data n'existe que sur l'endpoint détail
// Pastell (jamais sur la liste, confirmé le 2026-08-24) — un appel par doc affiché, écarté (coût).
