import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Observable, catchError, of, map } from 'rxjs';
import { EntiteInfo, UserContext } from 'src/app/core/model/user.model';
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

  private _logger = inject(NGXLogger);
  private _http = inject(HttpClient);
  private _settingsService = inject(SettingsService);


  /**
   * L'utilisateur connecté
   */
  userCurrent = signal<UserContext | null>(null);

  /**
   * L'entité sélectionné par défaut
   */
  entiteSelected = signal<EntiteInfo | null>(null);
  /**
   * Les flux de l'utilsiateur
   */
  userFlux = signal<Acte[]>([])


  public getUser(): Observable<void> {
    return this._http.get<UserContext>(this._settingsService.apiUrl + '/user').pipe(
      map((res: UserContext) => {
        this._logger.info('Successfully fetched user context');
        this.userCurrent.set(res);
      }),
      catchError((error) => {
        this._logger.error('Error fetching user context' + error);
        return of(void 0);
      })
    )
  }

  public getUserFlux(): Observable<void> {
    return this._http.get<{ [key: string]: Acte }>(this._settingsService.apiUrl + '/user/flux').pipe(
      map((data: { [key: string]: Acte }) => {
        const actes = Object.entries(data).map(([key, value]) => ({ id: key, ...value }));
        this.userFlux.set(actes);
      }
      ),
      catchError((error) => {
        this._logger.error('Error fetching user flux', error);
        return of(void 0);
      })
    );
  }

  /**
   * Fonction pour changer l'entité sélectionné
   * @param newEntite
   */
  public setEntiteSelected(newEntite: EntiteInfo): void {
    this.entiteSelected.set(newEntite);
  }

  public findEntiteById(id_e: number): EntiteInfo | null {
    return this._findEntiteInPath(id_e, this.userCurrent().entites)?.entite || null;
  }

  /**
   * Retourne les parents de l'entité 
   * @param entite 
   */
  public getParentPathEntite(entite: EntiteInfo): EntiteInfo[] {
    return this._findEntiteInPath(entite.id_e, this.userCurrent().entites).parents || [];
  }

  /**
   * Recherche l'entité en fonction de son id_e
   * @param id_e 
   * @param entites  Liste des entités racines ou enfants dans laquelle chercher
   * @param parents Tableau contenant la hiérarchie des parents (par défaut vide, utilisé dans la récursion)
   * @returns Un objet contenant l'entité trouvée et son chemin de parents, ou null si l'entité n'est pas trouvée
   */
  private _findEntiteInPath(id_e: number, entites: EntiteInfo[], parents: EntiteInfo[] = []): { entite: EntiteInfo, parents: EntiteInfo[] } | null {
    if (entites.length === 0) return null;

    for (const entite of entites) {
      // Si l'ID de l'entité correspond, on retourne l'entité
      if (entite.id_e === id_e) {
        return { entite, parents };
      }
      // Si l'entité a des enfants, on recherche récursivement dans les enfants
      if (entite.child && entite.child.length > 0) {
        const found = this._findEntiteInPath(id_e, entite.child, [...parents, entite]);
        if (found) {
          return found; // Si un enfant correspondant est trouvé, on le retourne
        }
      }
    }
    return null;
  }
}