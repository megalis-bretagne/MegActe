interface BaseDocumentInfo {
  id_d: string;
  type: string;
  titre: string;
  creation: string;
  modification: string;
}

export interface ActionPossible {
  action: ActionPossibleEnum | string;
  message: string;
}

enum ActionPossibleEnum {
  Orientation = "orientation",
  Suppression = "supression",
  Modification = "modification",
  Teletransmission_TDT = "teletransmission-tdt",
  Annulation_TDT = "annulation-tdt",
  Creation = "creation",
  Duplicate = "duplicate",
  Verification_TDT = "verif-tdt",
}

interface DocumentActionDetails {
  last_action: string;
  last_action_date: string;
  last_action_message: string;
  action_possible: ActionPossible[];
}

export interface DocumentInfo extends BaseDocumentInfo, DocumentActionDetails {
  id_e: string;
  role: string;
  siren: string;
  selected: boolean;
}

export interface DocumentPaginate {
  documents: DocumentInfo[];
  pagination: {
    offset: number;
    limit: number;
    total: number;
    next: string;
    prev: string;
  } | null;
}

// Filtres avancés
export interface AdvancedFilters {
  etat?: string | null;
  etatDebut?: Date | null;
  etatFin?: Date | null;
  etatTransit?: string | null;
  etatTransitDebut?: Date | null;
  etatTransitFin?: Date | null;
}

interface TypePieceFichier {
  filename: string;
  typologie: string;
}

export interface TypePieceMeta {
  pieces?: (string | { filename: string; type_pj?: string })[];
  actes_type_pj_list?: Record<string, string>;
}

export interface DocumentData {
  envoi_tdt_actes?: string;
  envoi_depot?: string;
  envoi_sae?: string;
  numero_de_lacte?: string;
  objet?: string;
  document_papier?: string;
  acte_nature?: string;
  publication_open_data?: string;
  date_de_lacte?: string;
  classification?: string;
  arrete?: string[];
  autre_document_attache?: string[];
  type_piece?: string;
  type_acte?: string;
  type_pj?: string;
  type_piece_fichier?: TypePieceFichier[];
  [key: string]: string | string[] | TypePieceFichier[] | undefined;
}

export interface DocumentDetail extends DocumentActionDetails {
  info: BaseDocumentInfo;
  data: DocumentData;
  action_possible: ActionPossible[];
}
