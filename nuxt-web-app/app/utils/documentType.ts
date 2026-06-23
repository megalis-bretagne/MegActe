interface DocumentInfo {
  id_d: string;
  id_e: string;
  titre: string;
  type: string;
  last_action: string;
  last_action_date: string;
  last_action_message: string;
  action_possible: { action: string; message: string }[];
  selected: boolean;
}

export interface DocumentPaginate {
  documents: DocumentInfo[];
  pagination: { offset: number; limit: number; total: number; next: string; prev: string } | null;
}

