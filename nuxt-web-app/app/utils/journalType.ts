export interface JournalListEntry {
  id_j: string;
  type: string;
  id_e: string;
  id_u: string;
  id_d: string;
  action: string;
  message: string;
  date: string;
  date_horodatage: string;
  message_horodate: string;
  titre: string;
  document_type: string;
  denomination: string;
  nom: string;
  prenom: string;
  siren: string;
  document_type_libelle: string;
  action_libelle: string;
}

export type Journal = JournalListEntry[];
