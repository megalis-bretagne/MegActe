const ACTE_TABS: TabConfig[] = [
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
      "type_acte",
      "type_pj",
      "type_piece_fichier",
      "document_papier",
    ],
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

// ── Définition des onglets par flux ──────────────────────────────────────────
export const TABS_CONFIG: Record<string, TabConfig[]> = {
  "deliberations-studio": ACTE_TABS,
  "arretes-individuels-studio": ACTE_TABS,
};
