import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Observable, map } from 'rxjs';
import { Acte } from 'src/app/model/acte.model';
import { UserContext } from 'src/app/model/user.model';
import { SettingsService } from 'src/environments/settings.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  // private userContextSubject: BehaviorSubject<UserContext> = new BehaviorSubject<UserContext>(null);
  // // userContext$: Observable<UserContext> = this.userContextSubject.asObservable();
  // userContext$: Observable<UserContext>;

  // private userFluxSubject: BehaviorSubject<Acte[]> = new BehaviorSubject<Acte[]>([]);
  // userFlux$: Observable<Acte[]> = this.userFluxSubject.asObservable();

  constructor(private http: HttpClient, private logger: NGXLogger, private settingsService: SettingsService) {
  }

  // public getUserContext(): Observable<UserContext> {
  //   return this.http.get<UserContext>(this.settingsService.apiUrl + '/user').pipe(
  //     tap((data: UserContext) => {
  //       this.userContextSubject.next(data);
  //     }),
  //     catchError((error) => {
  //       this.logger.error('Error fetching user context', error);
  //       return of(null);
  //     })
  //   );
  // }

  public getUser(): Observable<UserContext> {
    return this.http.get<UserContext>(this.settingsService.apiUrl + '/user');
  }

  public getFlux():  Observable<Acte[]> {
    return this.http.get<{ [key: string]: Acte }>(this.settingsService.apiUrl + '/flux').pipe(
      map((data: { [key: string]: Acte }) => {
        return Object.values(data);
      }));
  }


  // public getUserFlux(): Observable<Acte[]> {
  //   return this.http.get<{ [key: string]: Acte }>(this.settingsService.apiUrl + '/flux').pipe(
  //     map((data: { [key: string]: Acte }) => {
  //       return Object.values(data);
  //     }),
  //     tap((data: Acte[]) => {
  //       this.logger.debug('Fetched user flux:', data);
  //       this.userFluxSubject.next(data);
  //     }),
  //     catchError((error) => {
  //       this.logger.error('Error fetching user flux', error);
  //       return of([]);
  //     })
  //   );
  // }

}