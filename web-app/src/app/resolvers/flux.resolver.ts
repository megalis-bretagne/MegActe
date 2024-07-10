import { Observable, of } from 'rxjs';
import { FluxService } from '../services/flux.service';
import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';



export const FluxResolver: ResolveFn<any> = (
    route
): Observable<any> => {
    const fluxService = inject(FluxService);
    const fluxId = route.paramMap.get('idflux');

    if (fluxId) {
        return fluxService.get_flux_detail(fluxId);
    }
    return of(null);
};


