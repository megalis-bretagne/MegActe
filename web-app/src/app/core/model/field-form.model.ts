export interface Field {
    idField: string;
    type: string;
    name?: string;
    preg_match?: string;
    preg_match_error?: string;
    value?: { [key: string]: string };
    multiple?: boolean;
    requis?: boolean;
    commentaire?: string;
    index?: boolean;
    link_name?: string;
    default?: string;
    "read-only"?: boolean;
    "no-show"?: boolean;
}

export interface Data {
    [idField: string]: Field;
}

export interface FluxDetailItem {
    name: string;
    type: string;
    requis?: boolean;
    multiple?: boolean;
    commentaire?: string;
    value?: { [idField: string]: string };
    preg_match?: string;
    preg_match_error?: string;
    index?: boolean;
    title?: boolean;
    onchange?: string;
    default?: string;
    read_only?: boolean;
    link_name?: string;
    choice_action?: string;
    visionneuse?: string;
    visionneuse_no_link?: boolean;
}
