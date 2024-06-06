import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { BehaviorSubject, Observable, catchError, of, tap } from 'rxjs';
import { Acte } from 'src/app/model/acte.model';
import { UserContext } from 'src/app/model/user.model';
import { SettingsService } from 'src/environments/settings.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl: string;
  private userContextSubject: BehaviorSubject<UserContext> = new BehaviorSubject<UserContext>(null);
  userContext$: Observable<UserContext> = this.userContextSubject.asObservable();

  private userFluxSubject: BehaviorSubject<Acte[]> = new BehaviorSubject<Acte[]>([]);
  userFlux$: Observable<Acte[]> = this.userFluxSubject.asObservable();

  constructor(private http: HttpClient, private logger: NGXLogger, private settingsService: SettingsService) {
    this.apiUrl = this.settingsService.apiUrl;
    this.getUserContext();
    this.getUserFlux();
  }

  private getUserContext() {
    this.http.get<UserContext>(this.apiUrl + '/user').pipe(
      tap((data: UserContext) => {
        this.userContextSubject.next(data);
      }),
      catchError((error) => {
        this.logger.error('Error fetching user context', error);
        return of(null);
      })
    ).subscribe({
      complete: () => {
        this.logger.info('User context fetching completed');
      }
    });
  }

  private getUserFlux() {
    this.http.get<Acte[]>(this.apiUrl + '/flux').pipe(
      tap((data: Acte[]) => {
        this.userFluxSubject.next(data);
      }),
      catchError((error) => {
        this.logger.error('Error fetching user flux', error);
        return of([]);
      })
    ).subscribe({
      complete: () => {
        this.logger.info('User flux fetching completed');
      }
    });
  }
}