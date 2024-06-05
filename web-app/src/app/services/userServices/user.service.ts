import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { Observable } from 'rxjs';
import { Acte } from 'src/app/model/acte.model';
import { UserContext } from 'src/app/model/user.model';
import { SettingsService } from 'src/environments/settings.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl: string;
  // private userContext: UserContext | undefined;

  constructor(private http: HttpClient, private keycloakService: KeycloakService, private settingsService: SettingsService) {
    this.apiUrl = this.settingsService.apiUrl;
    // this.getUserContext().subscribe(context => this.userContext = context);
  }

  getUserContext(): Observable<UserContext> {
    return this.http.get<UserContext>(this.apiUrl + '/user');
  }

  // getUserContextData(): UserContext | undefined {
  //   return this.userContext;
  // }

  getUserFlux(): Observable<Acte[]> {
    return this.http.get<Acte[]>(this.apiUrl + '/flux');
  }

}