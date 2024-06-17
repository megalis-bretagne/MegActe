import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Observable, catchError, of, tap } from 'rxjs';
import { SettingsService } from 'src/environments/settings.service';

@Injectable({
    providedIn: 'root'
})
export class FluxService {

    constructor(private http: HttpClient, private logger: NGXLogger, private settingsService: SettingsService) {
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

}