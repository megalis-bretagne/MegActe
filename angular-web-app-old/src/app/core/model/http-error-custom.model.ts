import { HttpErrorResponse } from "@angular/common/http";


export interface ErrorMapping {
    translatedMessage: string; // Message traduit lisible pour l'utilisateur
    closable: boolean;         // Indique si l'erreur peut être fermée
    formatMessage?: (detail: string) => string; // Permet d'ajouter le détail d'origine
}

export interface ErrorDetail {
    detail: string;
    code: string;
}

export interface HttpErrorCustom extends HttpErrorResponse {
    error: ErrorDetail;
}