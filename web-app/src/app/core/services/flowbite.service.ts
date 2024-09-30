import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class FlowbiteService {
    constructor(@Inject(PLATFORM_ID) private _platformId: any) { }

    loadFlowbite(callback: (flowbite: any) => void) {
        if (isPlatformBrowser(this._platformId)) {
            import('flowbite').then(flowbite => {
                callback(flowbite);
            });
        }
    }
}