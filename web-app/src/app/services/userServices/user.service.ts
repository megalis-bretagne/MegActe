import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { Observable } from 'rxjs';
import { UserContext } from 'src/app/model/user.model';
import { SettingsService } from 'src/environments/settings.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl: string;

  constructor(private http: HttpClient, private keycloakService: KeycloakService, private settingsService: SettingsService) {
    this.apiUrl = this.settingsService.apiUrl + '/user';
  }

  getUserContext(): Observable<UserContext> {
    return this.http.get<UserContext>(this.apiUrl);
  }

}