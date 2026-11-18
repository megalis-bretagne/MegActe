export interface UserInfo {
    id_u: number;
    login: string;
    nom: string;
    prenom: string;
    email: string;
    id_e: number;
}

export interface EntiteInfo {
    id_e: number;
    denomination: string;
    siren: string;
    type: string;
    entite_mere: number;
    centre_de_gestion: string;
    child: EntiteInfo[]
}
/**
 * Interface de réception des infos de l'utilisateur
 */
export interface UserHttpResponse {
    user_info: UserInfo;
    entites: EntiteInfo[];
}

/**
 * Interface model au seins de l'application
 */
export interface UserContext {
    user_info: UserInfo;
    entite: EntiteInfo;
}

export function sortEntiteInfo(entities: EntiteInfo[]): EntiteInfo[] {
    return entities.sort((e1, e2) => e1.denomination.trim().localeCompare(e2.denomination.trim()));
}