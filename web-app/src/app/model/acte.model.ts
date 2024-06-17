export interface Acte {
    id: string;
    type: string;
    nom: string;
}

export interface GroupedActes {
    type: string;
    nom: string[];
}