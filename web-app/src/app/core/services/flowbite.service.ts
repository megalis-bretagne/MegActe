import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class FlowbiteService {
    constructor(@Inject(PLATFORM_ID) private readonly _platformId: object) { }

    loadFlowbite(callback: (flowbite: unknown) => void) {
        if (isPlatformBrowser(this._platformId)) {
            import('flowbite').then(flowbite => {
                callback(flowbite);
            });
        }
    }
}