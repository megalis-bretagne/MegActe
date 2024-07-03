export interface Field {
    key: string;
    type: string;
    preg_match?: string;
    [prop: string]: any;
}

export interface Data {
    [key: string]: Field;
}

export interface FluxDetailItem {
    name: string;
    type: string;
    requis?: boolean;
    multiple?: boolean;
    commentaire?: string;
    value?: { [key: string]: string };
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
