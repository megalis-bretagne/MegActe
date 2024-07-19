import { Pagination } from "./pagination.model";

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

export interface DocumentPaginate {
    pagination: Pagination,
    documents: DocumentInfo[]
}

export interface DocumentDetail {
    info: {
        id_d: string;
        type: string;
        titre: string;
        creation: string;
        modification: string;
    };

    last_action: {
        action: string;
        message: string;
        date: string;
    };
    action_possible: string[];
}