import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Observable, catchError, of, tap, map } from 'rxjs';
import { SettingsService } from 'src/environments/settings.service';
import { Acte } from 'src/app/model/acte.model';


@Injectable({
    providedIn: 'root'
})
export class FluxService {

    constructor(private http: HttpClient, private logger: NGXLogger, private settingsService: SettingsService) {
    }

    public getFlux(): Observable<Acte[]> {
        return this.http.get<{ [key: string]: Acte }>(this.settingsService.apiUrl + '/flux').pipe(
            map((data: { [key: string]: Acte }) =>
                Object.entries(data).map(([key, value]) => ({ id: key, ...value }))
            ),
            catchError((error) => {
                this.logger.error('Error fetching user flux', error);
                return of([]);
            })
        );
    }

    public get_flux_detail(acteNom: string): Observable<any> {
        return this.http.get<any>(`${this.settingsService.apiUrl}/flux/${acteNom}`).pipe(
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
}