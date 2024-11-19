import { inject, Injectable, signal } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Observable, forkJoin, map } from 'rxjs';
import { EntiteInfo, UserContext, UserHttpResponse } from 'src/app/core/model/user.model';
import { Flux } from '../model/flux.model';
import { HttpUserService } from './http/http-user.service';

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

  private readonly _logger = inject(NGXLogger);
  private readonly _httpUserService = inject(HttpUserService);
  static readonly ID_E_MERE = -1;

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
  userFlux = signal<Flux[]>([])

  /**
   * Le flux sélectionné par défaut
   */
  fluxSelected = signal<Flux | null>(null)

  /**
   * Service qui lance l'initialisation des informations de l'utilisateur connecté
   * @returns 
   */
  public initUserConnected(): Observable<void> {
    return forkJoin({ user: this._httpUserService.getUser(), flux: this._httpUserService.getUserFlux() }).pipe(
      map((res: { user: UserHttpResponse, flux: { [key: string]: Flux } }) => {
        this._logger.info('Successfully fetched user context');
        if (res.user.entites.length > 1) { // si plus d'une entité, on ajoute une racine fictive
          const entite_mere = { id_e: UserContextService.ID_E_MERE, denomination: "Sélectionner une entité", entite_mere: 0, siren: "", type: "", child: res.user.entites } as EntiteInfo;
          this.userCurrent.set({ user_info: res.user.user_info, entite: entite_mere } as UserContext);
        } else {
          this.userCurrent.set({ user_info: res.user.user_info, entite: res.user.entites[0] ?? undefined } as UserContext);
        }
        const actes: Flux[] = Object.entries(res.flux).map(([key, value]) => ({ id: key, ...value }));
        this.userFlux.set(actes);
      })
    )
  }

  public isSuperAdmin(): boolean {
    return this.userCurrent().user_info.id_e === 0;
  }


  public selectCurrentFlux(id_flux: string | null) {
    if (id_flux) this.fluxSelected.set(this.userFlux().find(acte => acte.id === id_flux));
    else this.fluxSelected.set(null)
  }

  /**
   * Fonction pour changer l'entité sélectionné
   * @param newEntite
   */
  public setEntiteSelected(newEntite: EntiteInfo): void {
    this.entiteSelected.set(newEntite);
  }

  public findEntiteById(id_e: number): EntiteInfo | null {
    if (id_e === UserContextService.ID_E_MERE) return null;
    return this._findEntiteInPath(id_e, this.userCurrent().entite.child)?.entite || null;
  }

  /**
   * Retourne les parents de l'entité 
   * @param entite 
   */
  public getParentPathEntite(entite: EntiteInfo): EntiteInfo[] {
    if (entite.id_e === UserContextService.ID_E_MERE) return [];
    if (entite.id_e === this.userCurrent().entite.id_e) return [];
    return this._findEntiteInPath(entite.id_e, this.userCurrent().entite.child, [this.userCurrent().entite]).parents || [];
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