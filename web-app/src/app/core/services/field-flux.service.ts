import { inject, Injectable } from '@angular/core';
import { Data } from '@angular/router';
import { Field } from '../model/field-form.model';
import { SettingsService } from 'src/environments/settings.service';


@Injectable({
    providedIn: 'root'
})
export class FieldFluxService {
    private readonly _settingsService = inject(SettingsService);


    // Générer un id unique pour chaque champs 
    generateUniqueId(prefix: string = 'id'): string {
        return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Extraire les champs selon leur type et dans l'ordre de réception
    extractFields(data: Data): Field[] {
        return Object.entries(data).map(([idField, value]) => ({ idField, ...value }));
    }



    filterFields(fields: Field[], flowId: string): Field[] {

        // on applique les règles suivantes dans l'ordre:
        // - no-show = true => exclue
        // - si type non présent => exclue
        // - si requis => garde
        //          - si type = file && read_only => exclue
        // - si lecte seule => exclue
        // - si type date ou file et sans commentaire => exclue
        // 
        const filteredFields = fields.filter(field => {
            if (field['no-show']) return false;
            if (!field.type) return false;
            if (field.requis) {
                if (field.type === 'file' && field['read-only']) return false;
                return true;
            }
            if (field['read-only'] && field['read-only'] === true) return false
            if ((field.type === 'date' || field.type === 'file') && !field.commentaire) return false

            return true;
        });
        return filteredFields.sort((f1, f2) => {
            if (f1['requis'] === f2['requis']) return 0
            if (f1['requis']) return -1
            if (f2['requis']) return 1
            return 0
        });
    }

    // Nettoyer les délimiteurs de l'expression régulière
    cleanRegex(regex: string): string {
        const regexFlagsPattern = /[a-z]*$/;
        regex = regex.replace(regexFlagsPattern, '');

        const delimiters = ['/', '#', '~', '|', '!', '@', '%', ';', ':', '^'];
        if (delimiters.includes(regex.charAt(0))) {
            regex = regex.substring(1);
        }
        if (delimiters.includes(regex.charAt(regex.length - 1))) {
            regex = regex.slice(0, -1);
        }

        return regex;
    }


}

