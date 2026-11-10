import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Observable, catchError, of, tap } from 'rxjs';
import { SettingsService } from 'src/environments/settings.service';
import { Flux } from '../../model/flux.model';


export type ExternalDataObject = {
    [key: string]: boolean | string | number | string[] | object | { [key: string]: string }; // Autorise aussi des tableaux de strings et des objets
};

@Injectable({
    providedIn: 'root'
})
export class HttpFluxService {
    private readonly _logger = inject(NGXLogger);
    private readonly _http = inject(HttpClient);
    private readonly _settingsService = inject(SettingsService);


    public get_flux_detail(fluxId: string): Observable<{ [key: string]: Flux }> {
        return this._http.get<{ [key: string]: Flux }>(`${this._settingsService.apiUrl}/flux/${fluxId}`).pipe(
            tap(() => this._logger.info('Successfully fetched flux detail')),
            catchError((error) => {
                this._logger.error('Failed to retrieve flux detail', error);
                return of(null);
            })
        );
    }

    public get_externalData(entiteId: number, documentId: string, elementId: string): Observable<ExternalDataObject> {
        const url = `${this._settingsService.apiUrl}/entite/${entiteId}/document/${documentId}/externalData/${elementId}`;
        return this._http.get<ExternalDataObject>(url).pipe(
            tap(() => this._logger.info('Successfully fetched external data')),
            catchError((error) => {
                this._logger.error('Failed to retrieve external data', error);
                return of({});
            })
        );
    }
}