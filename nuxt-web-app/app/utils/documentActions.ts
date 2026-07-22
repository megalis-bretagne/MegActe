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
    return !!a.message && a.action !== "modification";
}

export function hasAction(
    doc: { action_possible?: { action: string }[] },
    action: string,
) {
    return doc.action_possible?.some((a) => a.action === action) ?? false;
}