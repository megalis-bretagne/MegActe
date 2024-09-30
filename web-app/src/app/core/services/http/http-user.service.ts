import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Observable, catchError, of } from 'rxjs';
import { UserContext } from 'src/app/core/model/user.model';
import { SettingsService } from 'src/environments/settings.service';
import { Flux } from '../../model/flux.model';

/**
 * 
 * Service contenant les informations de l'utilisateur connecté.
 * Ce service présent :
 * - l'utilisateur connecté
 * - les flux disponibles de l'utilisateur
 * - le flux sélectionné
 * 
 */
@Injectable({
    providedIn: 'root'
})
export class HttpUserService {

    private _logger = inject(NGXLogger);
    private _http = inject(HttpClient);
    private _settingsService = inject(SettingsService);


    public getUser(): Observable<UserContext> {
        return this._http.get<UserContext>(this._settingsService.apiUrl + '/user').pipe(
            catchError((error) => {
                this._logger.error('Error fetching user context' + error);
                return of(void 0);
            })
        )
    }

    public getUserFlux(): Observable<{ [key: string]: Flux }> {
        return this._http.get<{ [key: string]: Flux }>(this._settingsService.apiUrl + '/user/flux').pipe(
            catchError((error) => {
                this._logger.error('Error fetching user flux', error);
                return of(void 0);
            })
        );
    }

}