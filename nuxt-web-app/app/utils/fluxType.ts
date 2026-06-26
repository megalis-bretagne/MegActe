export interface Flux {
  id?: string;
  type: string;
  nom: string;
  enable: boolean;
};

/* some fields might be missing */
export interface FluxDetails {
  name: string;
  title?: boolean;
  type?: string;
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
