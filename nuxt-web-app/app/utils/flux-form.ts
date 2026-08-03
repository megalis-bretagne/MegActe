// Surcharges par onglet pour le formulaire (champs différents de la vue détail)
export const FORM_TAB_FIELD_OVERRIDES: Record<
  string,
  Record<string, string[]>
> = {
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

// Extrait les extensions autorisées depuis un commentaire technique
export function parseAcceptFromComment(comment: string | null): string | null {
  if (!comment) return null;
  const matches = comment.match(
    /\b(PDF|DOC|DOCX|ODT|XLS|XLSX|ODS|PNG|JPG|JPEG|GIF|ZIP|XML|CSV|TXT|RTF|ODP|PPT|PPTX)\b/gi
  );
  return matches?.length
    ? matches.map((ext) => `.${ext.toLowerCase()}`).join(",")
    : null;
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function isExternalOptionHeader(opt: string): boolean {
  return /^\d+\s/.test(opt) && !/^\d+\.\d+/.test(opt);
}

// Décode les entités HTML nommées/numériques présentes telles quelles dans les commentaires
// techniques renvoyés par Pastell (ex: "Caractères interdits : &oelig;, &euro;.")
const HTML_NAMED_ENTITIES: Record<string, string> = {
  oelig: "œ",
  OElig: "Œ",
  euro: "€",
  eacute: "é",
  egrave: "è",
  ecirc: "ê",
  agrave: "à",
  ccedil: "ç",
  ugrave: "ù",
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&(\w+);/g, (match, name) => HTML_NAMED_ENTITIES[name] ?? match);
}

// Validation "numéro d'acte" : 2 à 15 caractères, majuscules/chiffres/underscore uniquement
export function validateNumeroActe(
  value: string | null | undefined
): string | null {
  if (!value) return null;
  if (!/^[A-Z0-9_]{2,15}$/.test(value)) {
    return "Le texte doit faire entre 2 et 15 caractères et ne peut contenir que des chiffres, lettres en majuscule et le caractère underscore (_).";
  }
  return null;
}

// Validation "objet" : 256 caractères maxi, caractères interdits œ/Œ et €
export function validateObjet(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.length > 256 || /[œ€]/i.test(value)) {
    return "256 caractères maxi. Caractères interdits : œ, €.";
  }
  return null;
}

// Contrôles sur les fichiers déposés (acte + annexes) avant téléversement
export const MAX_TOTAL_FILES_SIZE_BYTES = 150 * 1024 * 1024; // 150 Mo

export function findDuplicateFileName(files: File[]): string | null {
  const seen = new Set<string>();
  for (const file of files) {
    const name = file.name.trim().toLowerCase();
    if (seen.has(name)) return file.name;
    seen.add(name);
  }
  return null;
}

export function findNonPdfFileName(files: File[]): string | null {
  return (
    files.find((f) => !f.name.toLowerCase().endsWith(".pdf"))?.name ?? null
  );
}
