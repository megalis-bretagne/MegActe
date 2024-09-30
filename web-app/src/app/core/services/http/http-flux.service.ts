import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Observable, catchError, of, tap } from 'rxjs';
import { SettingsService } from 'src/environments/settings.service';


@Injectable({
    providedIn: 'root'
})
export class HttpFluxService {
    private _logger = inject(NGXLogger);
    private _http = inject(HttpClient);
    private _settingsService = inject(SettingsService);



    public get_flux_detail(fluxId: string): Observable<any> {
        return this._http.get<any>(`${this._settingsService.apiUrl}/flux/${fluxId}`).pipe(
            tap(() => this._logger.info('Successfully fetched flux detail')),
            catchError((error) => {
                this._logger.error('Failed to retrieve flux detail', error);
                return of(null);
            })
        );
    }

    public get_externalData(entiteId: number, documentId: string, elementId: string): Observable<any> {
        const url = `${this._settingsService.apiUrl}/entite/${entiteId}/document/${documentId}/externalData/${elementId}`;
        return this._http.get<any>(url).pipe(
            tap(() => this._logger.info('Successfully fetched external data')),
            catchError((error) => {
                this._logger.error('Failed to retrieve external data', error);
                return of({});
            })
        );
    }
}