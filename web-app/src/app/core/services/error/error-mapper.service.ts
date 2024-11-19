import { Injectable } from '@angular/core';
import { ErrorMapping } from '../../model/http-error-custom.model';

@Injectable({
    providedIn: 'root',
})
export class ErrorMapperService {
    private readonly _errorMappings: Record<string, ErrorMapping> = {
        USER_NOT_REGISTER: {
            translatedMessage: 'L’utilisateur n’est pas enregistré ou n’a pas les droits d’utiliser le service.',
            closable: false,
        },
        PASTELL_NO_RIGHT: {
            translatedMessage: 'Vous n’avez pas l’autorisation pour effectuer cette action dans Pastell.',
            closable: true,
            formatMessage: (detail: string) => `Vous n’avez pas les droits pour effectuer l'action : ${detail}`,
        },
        MEGACTE_CREATE_DOCUMENT_NO_RIGHT: {
            translatedMessage: 'Vous n’avez pas l’autorisation de créer de document dans Pastell.',
            closable: true,
        },
        DEFAULT: {
            translatedMessage: 'Une erreur inattendue est survenue. Merci de contacter votre administrateur.',
            closable: true,
        },
    };

    // Méthode pour récupérer les détails de l'erreur
    getErrorMapping(code: string, detail?: string): ErrorMapping {
        const mapping = this._errorMappings[code];
        if (!mapping) {
            return this._errorMappings['DEFAULT'];
        }

        // Si `formatMessage` existe et qu'un détail est fourni, formate le message
        if (mapping.formatMessage && detail) {
            return {
                ...mapping,
                translatedMessage: mapping.formatMessage(detail),
            };
        }

        return mapping;
    }
}
