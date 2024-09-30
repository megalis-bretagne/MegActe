import { inject, Injectable } from '@angular/core';
import { Data } from '@angular/router';
import { Field } from '../model/field-form.model';
import { SettingsService } from 'src/environments/settings.service';


@Injectable({
    providedIn: 'root'
})
export class FieldFluxService {
    private _settingsService = inject(SettingsService);


    // Générer un id unique pour chaque champs 
    generateUniqueId(prefix: string = 'id'): string {
        return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Extraire les champs selon leur type et dans l'ordre de réception
    extractFields(data: Data): Field[] {
        return Object.entries(data).map(([idField, value]) => ({ idField, ...value }));
    }



    filterFields(fields: Field[], flowId: string): Field[] {
        const filteredFields = fields.filter(field => {
            return !field['read-only'] && !field['no-show'] && field['requis']
        });

        const additionalFields = this._settingsService.getFlowType(flowId) || [];

        additionalFields.forEach(fieldId => {
            const field = fields.find(f => f.idField === fieldId);
            if (field) {
                filteredFields.push(field);
            }
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

