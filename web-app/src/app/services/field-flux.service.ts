import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class FieldFluxService {

    generateUniqueId(prefix: string = 'id'): string {
        return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
