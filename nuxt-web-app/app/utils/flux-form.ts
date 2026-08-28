// Flux "studio" qui partagent la même config d'onglet "Préparer" et les mêmes cases d'envoi.
const STUDIO_FLUX_TYPES = [
  "deliberations-studio",
  "arretes-individuels-studio",
  "actes-reglementaires-studio",
  "autres-studio",
  "contrats-studio",
  "documents-budgetaires-studio",
] as const;

const STUDIO_PREPARER_FIELDS = [
  "acte_nature",
  "numero_de_lacte",
  "objet",
  "comment",
  "arrete",
  "autre_document_attache",
  "publication_open_data",
];

const STUDIO_SEND_DEFAULTS: Record<string, string> = {
  envoi_tdt_actes: "checked",
  envoi_depot: "checked",
  envoi_sae: "checked",
};

const fromStudioFlux = <T>(value: T): Record<string, T> =>
  Object.fromEntries(STUDIO_FLUX_TYPES.map((type) => [type, value]));

// Surcharges par onglet pour le formulaire (champs différents de la vue détail)
export const FORM_TAB_FIELD_OVERRIDES: Record<
  string,
  Record<string, string[]>
> = {
  preparer: {
    ...fromStudioFlux(STUDIO_PREPARER_FIELDS),
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
    default: ["date_de_lacte", "document_papier", "classification"],
  },
};

export const FORM_DEFAULTS: Record<string, Record<string, string>> = {
  ...fromStudioFlux(STUDIO_SEND_DEFAULTS),
  "autres-studio-sans-tdt": {
    envoi_depot: "checked",
  },
};

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

// Pastell renvoie parfois un objet JSON à clés numériques (ex: '{"0":"a.pdf"}') au lieu
// d'un tableau pour un champ multi-fichiers : on le détecte et remet dans l'ordre.
export function toFileList(val: unknown): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object") {
          const obj = parsed as Record<string, string>;
          return Object.keys(obj)
            .sort((a, b) => Number(a) - Number(b))
            .map((k) => obj[k]);
        }
      } catch {
        // Pas du JSON valide : on traite la chaîne comme un nom de fichier unique ci-dessous.
      }
    }
    return val ? [val] : [];
  }
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, string>;
    return Object.keys(obj)
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => obj[k]);
  }
  return val ? [val as string] : [];
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

// Valide chaque fichier contre `field.accept` (dérivé du commentaire Pastell) ; si absent,
// retombe sur PDF par défaut plutôt que tout accepter.
export function findInvalidFileName(
  files: File[],
  accept: string | null
): string | null {
  const extensions = accept
    ?.split(",")
    .map((ext) => ext.trim().toLowerCase()) ?? [".pdf"];
  return (
    files.find(
      (f) => !extensions.some((ext) => f.name.toLowerCase().endsWith(ext))
    )?.name ?? null
  );
}
