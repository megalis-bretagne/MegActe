// Surcharges par onglet pour le formulaire (champs différents de la vue détail)
export const FORM_TAB_FIELD_OVERRIDES: Record<string, Record<string, string[]>> = {
    preparer: {
        "deliberations-studio": [
            "acte_nature",
            "numero_de_lacte",
            "objet",
            "comment",
            "arrete",
            "autre_document_attache",
            "publication_open_data",
        ],
        "arretes-individuels-studio": [
            "acte_nature",
            "numero_de_lacte",
            "objet",
            "comment",
            "arrete",
            "autre_document_attache",
            "publication_open_data",
        ],
        "actes-reglementaires-studio": [
            "acte_nature",
            "numero_de_lacte",
            "objet",
            "comment",
            "arrete",
            "autre_document_attache",
            "publication_open_data",
        ],
        "autres-studio": [
            "acte_nature",
            "numero_de_lacte",
            "objet",
            "comment",
            "arrete",
            "autre_document_attache",
            "publication_open_data",
        ],
        "contrats-studio": [
            "acte_nature",
            "numero_de_lacte",
            "objet",
            "comment",
            "arrete",
            "autre_document_attache",
            "publication_open_data",
        ],
        "documents-budgetaires-studio": [
            "acte_nature",
            "numero_de_lacte",
            "objet",
            "comment",
            "arrete",
            "autre_document_attache",
            "publication_open_data",
        ],
        "autres-studio-sans-tdt": [
            "acte_nature",
            "nature_autre_detail",
            "numero_de_lacte",
            "objet",
            "date_de_lacte",
            "classification",
            "arrete",
            "autre_document_attache",
            "publication_open_data",
        ],
    },
    acte: {
        default: [
            "date_de_lacte",
            "document_papier",
            "classification",
            "type_piece",
        ],
    },
};

// Valeurs par défaut (par flux)
export const FORM_DEFAULTS: Record<string, Record<string, any>> = {
    "arretes-individuels-studio": {
        envoi_tdt_actes: "checked",
        envoi_depot: "checked",
        envoi_sae: "checked",
    },
    "deliberations-studio": {
        envoi_tdt_actes: "checked",
        envoi_depot: "checked",
        envoi_sae: "checked",
    },
    "actes-reglementaires-studio": {
        envoi_tdt_actes: "checked",
        envoi_depot: "checked",
        envoi_sae: "checked",
    },
    "autres-studio": {
        envoi_tdt_actes: "checked",
        envoi_depot: "checked",
        envoi_sae: "checked",
    },
    "contrats-studio": {
        envoi_tdt_actes: "checked",
        envoi_depot: "checked",
        envoi_sae: "checked",
    },
    "documents-budgetaires-studio": {
        envoi_tdt_actes: "checked",
        envoi_depot: "checked",
        envoi_sae: "checked",
    },
    "autres-studio-sans-tdt": {
        envoi_depot: "checked",
    },
};

// Extrait les extensions autorisées depuis un commentaire technique[cite: 3]
export function parseAcceptFromComment(comment: string | null): string | null {
    if (!comment) return null;
    const matches = comment.match(
        /\b(PDF|DOC|DOCX|ODT|XLS|XLSX|ODS|PNG|JPG|JPEG|GIF|ZIP|XML|CSV|TXT|RTF|ODP|PPT|PPTX)\b/gi
    );
    return matches?.length ? matches.map((ext) => `.${ext.toLowerCase()}`).join(",") : null;
}

export function todayISO(): string {
    return new Date().toISOString().split("T")[0];
}

export function isExternalOptionHeader(opt: string): boolean {
    return /^\d+\s/.test(opt) && !/^\d+\.\d+/.test(opt);
}