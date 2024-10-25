import { Pagination } from "./pagination.model";

export interface DocCreateInfo {
    flux_type: string;
    doc_info: { [key: string]: string | number | boolean | Date };
}

export interface DocUpdateInfo {
    doc_info: { [key: string]: string | number | boolean | Date };
}

export interface ActionPossible {
    action: ActionPossibleEnum | string;
    message: string
}

export interface BaseDocumentInfo {
    id_d: string;
    last_action_date: string;
    type: string;
    titre: string;
    creation: string;
    modification: string;
}

export interface DocumentActionDetails {
    last_action: string;
    last_action_date: string;
    last_action_message: string;
    action_possible: ActionPossible[];
}

export interface DocumentInfo extends BaseDocumentInfo, DocumentActionDetails {
    id_e: string;
    role: string;
    last_type: string;
    selected: boolean;
}

export interface DocumentRequestAction {
    document_ids: string | string[],
    action: ActionPossibleEnum | string,
}


export interface DocumentPaginate {
    pagination: Pagination,
    documents: DocumentInfo[]
}

export interface TypePieceFichier {
    filename: string,
    typologie: string
}


export enum ActionPossibleEnum {
    Orientation = 'orientation',
    Suppression = 'supression',
    Modification = 'modification',
    Teletransmission_TDT = 'teletransmission-tdt',
    Creation = "creation",
    Verification_TDT = 'verif-tdt'
    // Ajoute d'autres actions si nécessaire
}

export interface DocumentDetail extends DocumentActionDetails {
    info: BaseDocumentInfo;

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
        [key: string]: string | number | TypePieceFichier[] | string[]
    };
}