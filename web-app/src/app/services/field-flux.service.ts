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

    // Extraire les champs selon leur type
    extractFields(data: Data): {
        textFields: Field[],
        checkboxFields: Field[],
        selectFields: Field[],
        dateFields: Field[]
    } {
        const textFields: Field[] = [];
        const checkboxFields: Field[] = [];
        const selectFields: Field[] = [];
        const dateFields: Field[] = [];

        const typeToFieldArray: { [type: string]: Field[] } = {
            'text': textFields,
            'checkbox': checkboxFields,
            'select': selectFields,
            'date': dateFields,
        };

        for (const [key, value] of Object.entries(data)) {
            const field: Field = { key, ...value };

            if (typeToFieldArray[field.type]) {
                typeToFieldArray[field.type].push(field);
            }
        }

        return { textFields, checkboxFields, selectFields, dateFields };
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