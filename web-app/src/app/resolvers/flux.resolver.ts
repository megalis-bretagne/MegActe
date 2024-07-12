import { Observable, of, tap } from 'rxjs';
import { FluxService } from '../services/flux.service';
import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { SharedDataService } from '../services/sharedData.service';

export const FluxResolver: ResolveFn<any> = (
    route,
    state
): Observable<any> => {
    const fluxService = inject(FluxService);
    const sharedDataService = inject(SharedDataService);
    const acteNom = sharedDataService.getActeID();

    if (acteNom) {
        const acteId = sharedDataService.getFieldByName(acteNom);
        if (acteId) {
            return fluxService.get_flux_detail(acteId).pipe(
                tap(fluxDetail => {
                    sharedDataService.setFluxDetail(fluxDetail);
                })
            );
        }
    }
    //  Retourne un observable null si acteId n'existe pas
    return of(null);
};


