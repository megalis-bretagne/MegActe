export interface Journal {
  id_j: string;
  type: string;
  action: string;
  message: string;
  date: string;
  nom?: string;
  prenom?: string;
  action_libelle: string;
}
