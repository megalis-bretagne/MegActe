import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { NGXLogger } from 'ngx-logger';
import { SettingsService } from 'src/environments/settings.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private keycloakService: KeycloakService, private settings: SettingsService, private logger: NGXLogger
  ) { }

  checkLogin(): Promise<Keycloak.KeycloakProfile> {
    return this.keycloakService.loadUserProfile();
  }

  getToken(): Promise<string> {
    return this.keycloakService.getToken();
  }

  logout(): void {
    this.keycloakService.logout(this.settings.settings.keycloak.urlLogout).then(() => {
      this.logger.info('Déconnexion réussie');
    }).catch((err) => {
      this.logger.error('Erreur lors de la déconnexion', err);
    });
  }
}
