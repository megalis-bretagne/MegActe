import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserHttpResponse } from 'src/app/core/model/user.model';
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

    private readonly _http = inject(HttpClient);
    private readonly _settingsService = inject(SettingsService);


    public getUser(): Observable<UserHttpResponse> {
        return this._http.get<UserHttpResponse>(this._settingsService.apiUrl + '/user')
    }

    public getUserFlux(): Observable<{ [key: string]: Flux }> {
        return this._http.get<{ [key: string]: Flux }>(this._settingsService.apiUrl + '/user/flux')
    }

}