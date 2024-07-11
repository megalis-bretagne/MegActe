import { Injectable } from '@angular/core';
import { Data } from '@angular/router';
import { Field } from '../model/field-form.model';

@Injectable({
    providedIn: 'root'
})
export class FieldFluxService {

    // Générer un id unique pour chaque champs 
    generateUniqueId(prefix: string = 'id'): string {
        return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Extraire les champs selon leur type et dans l'ordre de réception
    extractFields(data: Data): Field[] {
        return Object.entries(data).map(([key, value]) => ({ key, ...value }));
    }

    // Exclure les champs qui sont en read-only, qui sont marqués comme "no-show" ou qui ont 2 attrs ou moins, 
    filterFields(fields: Field[]): Field[] {
        return fields.filter(field => {
            const fieldKeys = Object.keys(field);
            return !field['read-only'] && fieldKeys.length > 3 && !field['no-show'];
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