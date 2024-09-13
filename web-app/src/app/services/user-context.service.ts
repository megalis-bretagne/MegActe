import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Observable, catchError, of, map } from 'rxjs';
import { UserContext } from 'src/app/model/user.model';
import { SettingsService } from 'src/environments/settings.service';
import { Acte } from '../model/acte.model';

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
export class UserContextService {
  /**
   * L'utilisateur connecté
   */
  userCurrent = signal<UserContext | null>(null);
  /**
   * Les flux de l'utilsiateur
   */
  userFlux = signal<Acte[]>([])


  constructor(private http: HttpClient, private logger: NGXLogger, private settingsService: SettingsService) {
  }

  public getUser(): Observable<void> {
    return this.http.get<UserContext>(this.settingsService.apiUrl + '/user').pipe(
      map((res) => {
        this.logger.info('Successfully fetched user context');
        this.userCurrent.set(res);
      }),
      catchError((error) => {
        this.logger.error('Error fetching user context' + error);
        return of(void 0);
      })
    )
  }

  public getUserFlux(): Observable<void> {
    return this.http.get<{ [key: string]: Acte }>(this.settingsService.apiUrl + '/user/flux').pipe(
      map((data: { [key: string]: Acte }) => {
        const actes = Object.entries(data).map(([key, value]) => ({ id: key, ...value }));
        this.userFlux.set(actes);
      }
      ),
      catchError((error) => {
        this.logger.error('Error fetching user flux', error);
        return of(void 0);
      })
    );
  }

}