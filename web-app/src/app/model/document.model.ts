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

export interface TypePieceFichier {
    filename: string,
    typologie: string
}

export interface DocumentDetail {
    info: {
        id_d: string;
        type: string;
        titre: string;
        creation: string;
        modification: string;
    };

    data: {
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
        [key: string]: any;
    };

    last_action: {
        action: string;
        message: string;
        date: string;
    };
    action_possible: string[];
}