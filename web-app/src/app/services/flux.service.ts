import { HttpClient } from '@angular/common/http';
import { effect, Injectable, signal } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Observable, catchError, of, tap } from 'rxjs';
import { SettingsService } from 'src/environments/settings.service';
import { Acte } from '../model/acte.model';


@Injectable({
    providedIn: 'root'
})
export class FluxService {

    fluxSelected = signal<Acte | null>(null)


    constructor(private http: HttpClient, private logger: NGXLogger, private settingsService: SettingsService) {
    }

    public get_flux_detail(fluxId: string): Observable<any> {
        return this.http.get<any>(`${this.settingsService.apiUrl}/flux/${fluxId}`).pipe(
            tap(() => this.logger.info('Successfully fetched flux detail')),
            catchError((error) => {
                this.logger.error('Failed to retrieve flux detail', error);
                return of(null);
            })
        );
    }

    public get_externalData(entiteId: number, documentId: string, elementId: string): Observable<any> {
        const url = `${this.settingsService.apiUrl}/document/${documentId}/externalData/${elementId}?entite_id=${entiteId}`;
        return this.http.get<any>(url).pipe(
            tap(() => this.logger.info('Successfully fetched external data')),
            catchError((error) => {
                this.logger.error('Failed to retrieve external data', error);
                return of({});
            })
        );
    }

    public selectFlux(acte: Acte) {
        this.fluxSelected.set(acte);
    }
}