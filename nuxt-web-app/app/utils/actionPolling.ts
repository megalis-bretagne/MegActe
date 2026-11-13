// Pastell traite certaines actions de façon asynchrone : il faut attendre que last_action
// se stabilise avant de considérer le document à jour. Partagé entre le suivi single-doc
// (useDocumentActions) et le suivi par lot (useBatchDocuments).
export const ACTION_POLL_DELAYS_MS = [300, 600, 1000, 1500, 2000, 3000];
export const ACTION_POLL_FALLBACK_INTERVAL_MS = 3000;
export const ACTION_POLL_MAX_DURATION_MS = 30_000;
