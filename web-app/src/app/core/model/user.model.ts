export interface UserInfo {
    id_u: number;
    login: string;
    nom: string;
    prenom: string;
    email: string;
    certificat: any[];
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

export interface UserContext {
    user_info: UserInfo;
    entites: EntiteInfo[];
}

export function sortEntiteInfo(entities: any[]): any[] {
    return entities.sort((e1, e2) => e1.denomination.localeCompare(e2.denomination));
}