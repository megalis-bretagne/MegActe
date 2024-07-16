export interface DocCreateInfo {
    entite_id: number;
    flux_type: string;
    doc_info: any;
}

export interface DocUpdateInfo {
    entite_id: number;
    doc_info: any;
}

export interface DocumentInfo {
    id_d: string;
    id_e: string;
    role: string;
    last_action: string;
    last_action_date: string;
    last_type: string;
    type: string;
    titre: string;
    creation: string;
    modification: string;
    is_active: boolean;
    entite_base: string;
    last_action_display: string;
    [key: string]: any;
}