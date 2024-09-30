import { inject, Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { NGXLogger } from 'ngx-logger';
import { SettingsService } from 'src/environments/settings.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _keycloakService = inject(KeycloakService);
  private _settings = inject(SettingsService);
  private _logger = inject(NGXLogger);

  checkLogin(): Promise<Keycloak.KeycloakProfile> {
    return this._keycloakService.loadUserProfile();
  }

  getToken(): Promise<string> {
    return this._keycloakService.getToken();
  }

  logout(): void {
    this._keycloakService.logout(this._settings.settings.keycloak.urlLogout).then(() => {
      this._logger.info('Déconnexion réussie');
    }).catch((err) => {
      this._logger.error('Erreur lors de la déconnexion', err);
    });
  }
}
