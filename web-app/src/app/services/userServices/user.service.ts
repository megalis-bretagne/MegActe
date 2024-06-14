import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { Acte } from 'src/app/model/acte.model';
import { UserContext } from 'src/app/model/user.model';
import { SettingsService } from 'src/environments/settings.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient, private logger: NGXLogger, private settingsService: SettingsService) {
  }

  public getUser(): Observable<UserContext> {
    return this.http.get<UserContext>(this.settingsService.apiUrl + '/user').pipe(
      tap(() => this.logger.info('Successfully fetched user context')),
      catchError((error) => {
        this.logger.error('Error fetching user context', error);
        return of(null);
      })
    );
  }

  public getFlux(): Observable<Acte[]> {
    return this.http.get<{ [key: string]: Acte }>(this.settingsService.apiUrl + '/flux').pipe(
      map((data: { [key: string]: Acte }) => Object.values(data)),
      catchError((error) => {
        this.logger.error('Error fetching user flux', error);
        return of([]);
      })
    );
  }

}