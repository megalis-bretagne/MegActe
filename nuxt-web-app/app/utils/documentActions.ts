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
    return !!a.message && a.action !== "modification" && a.action !== "orientation";
}

export function hasAction(
    doc: { action_possible?: { action: string }[] },
    action: string,
) {
    return doc.action_possible?.some((a) => a.action === action) ?? false;
}

// Dans pastell, duplication n'est pas disponible pour le flux autres-studio-sans-tdt
const FLUX_WITHOUT_DUPLICATE = ["autres-studio-sans-tdt"];

export function canDuplicate(doc: { type?: string; last_action?: string }) {
    return doc.last_action !== "creation" && !FLUX_WITHOUT_DUPLICATE.includes(doc.type ?? "");
}

function tdtReturnForOneDoc(entiteId: number, idD: string): string {
    return `/retour-tdt?id_e=${entiteId}&id_d=${idD}&error=%%ERROR%%&message=%%MESSAGE%%`;
}

function tdtReturnForManyDocs(entiteId: number, idsD: string[]): string {
    const idParams = idsD.map((id) => `id_d[]=${id}`).join("&");
    return `/retour-tdt?id_e=${entiteId}&${idParams}`;
}

export function buildTdtReturnUrl(baseUrl: string, entiteId: number, idD: string | string[]): string {
    const returnPath = Array.isArray(idD)
        ? tdtReturnForManyDocs(entiteId, idD)
        : tdtReturnForOneDoc(entiteId, idD);

    const origin = `${window.location.protocol}//${window.location.host}`;
    const urlReturn = origin + encodeURIComponent(returnPath);

    return `${baseUrl}&url_return=${urlReturn}`;
}