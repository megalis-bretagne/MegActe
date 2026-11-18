export interface Flux {
  id?: string;
  type: string;
  nom: string;
  enable: boolean;
}

// Schéma d'un champ de flux renvoyé par Pastell. Tous les champs optionnels peuvent
// être absents selon le type de flux et la version de Pastell.
export interface FluxDetail {
  name: string;
  title?: boolean;
  type?: string;
  value: string;
  requis?: boolean;
  multiple?: boolean;
  commentaire?: string;
  onchange?: string;
  default?: string;
  readonly?: boolean;
  preg_match?: string;
  preg_match_error?: string;
  link_name?: string;
  "choice-action"?: string;
  "edit-only"?: boolean;
  visionneuse?: string;
  "visionneuse-no-link"?: boolean;
  "no-show"?: boolean;
}

export type FluxDetails = Record<string, FluxDetail>;
