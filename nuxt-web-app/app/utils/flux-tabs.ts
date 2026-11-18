export type TabConfig = {
  id: string;
  label: string;
  fields: string[];
  condition?: (data: DocumentDetail) => boolean;
  alwaysShow?: string[];
};

export type FieldValue =
  | string
  | string[]
  | Record<string, string>
  | TypePieceFichier[];

type FieldBase = {
  key: string;
  label: string;
  type: string;
  selectValues: Record<string, string> | null;
  commentaire: string;
};

export type Field = FieldBase & {
  val: FieldValue;
};

export type FieldEdit = FieldBase & {
  required: boolean;
  multiple: boolean;
  readonly: boolean;
  accept: string | null;
};

const STUDIO_TABS: TabConfig[] = [
  {
    id: "preparer",
    label: "Préparer",
    fields: [
      "acte_nature",
      "numero_de_lacte",
      "objet",
      "arrete",
      "autre_document_attache",
      "publication_open_data",
    ],
    alwaysShow: [
      "acte_nature",
      "numero_de_lacte",
      "objet",
      "publication_open_data",
    ],
  },
  {
    id: "cheminement",
    label: "Cheminement",
    fields: ["envoi_tdt_actes", "envoi_depot", "envoi_sae"],
  },
  {
    id: "acte",
    label: "Acte",
    fields: [
      "date_de_lacte",
      "classification",
      "type_piece_fichier",
      "document_papier",
    ],
    alwaysShow: ["document_papier"],
  },
  {
    id: "retour-tdt",
    label: "Retour Tdt",
    condition: (data) =>
      !!data.tedetis_transaction_id && data.has_bordereau === "1",
    fields: [
      "tedetis_transaction_id",
      "bordereau",
      "aractes",
      "acte_tamponne",
      "annexes_tamponnees",
      "date_ar",
      "acte_publication_date",
    ],
  },
  {
    id: "retour-ged",
    label: "Retour GED",
    condition: (data) => data.has_ged_document_id === "1",
    fields: ["ged_document_id_file"],
  },
  {
    id: "sae",
    label: "SAE",
    condition: (data) => data.sae_show === "1",
    fields: [
      "journal",
      "date_journal_debut",
      "date_cloture_journal",
      "date_cloture_journal_iso8601",
      "sae_transfert_id",
      "sae_bordereau",
      "sae_archive",
      "ar_sae",
      "sae_ack_comment",
      "reply_sae",
      "sae_archival_identifier",
      "sae_atr_comment",
    ],
  },
];

const AUTRES_SANS_TDT_TABS: TabConfig[] = [
  {
    id: "preparer",
    label: "Préparer",
    fields: [
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
    alwaysShow: [
      "acte_nature",
      "nature_autre_detail",
      "numero_de_lacte",
      "objet",
      "date_de_lacte",
      "classification",
      "publication_open_data",
    ],
  },
  {
    id: "cheminement",
    label: "Cheminement",
    fields: ["envoi_depot", "envoi_sae"],
  },
  {
    id: "retour-ged",
    label: "Retour GED",
    condition: (data) => data.has_ged_document_id === "1",
    fields: ["ged_document_id_file"],
  },
  {
    id: "sae",
    label: "SAE",
    condition: (data) => data.sae_show === "1",
    fields: [
      "journal",
      "date_journal_debut",
      "date_cloture_journal",
      "date_cloture_journal_iso8601",
      "sae_transfert_id",
      "sae_bordereau",
      "sae_archive",
      "ar_sae",
      "sae_ack_comment",
      "reply_sae",
      "sae_archival_identifier",
      "sae_atr_comment",
    ],
  },
];

export const FLUX_TABS_CONFIG: Record<string, TabConfig[]> = {
  "deliberations-studio": STUDIO_TABS,
  "arretes-individuels-studio": STUDIO_TABS,
  "actes-reglementaires-studio": STUDIO_TABS,
  "autres-studio": STUDIO_TABS,
  "autres-studio-sans-tdt": AUTRES_SANS_TDT_TABS,
  "contrats-studio": STUDIO_TABS,
  "documents-budgetaires-studio": STUDIO_TABS,
};
