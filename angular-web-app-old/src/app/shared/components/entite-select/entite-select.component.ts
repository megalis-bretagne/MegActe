import { Component, effect, ElementRef, inject, output, ViewChild } from "@angular/core";
import { UserContextService } from "src/app/core/services/user-context.service";
import { CommonModule } from "@angular/common";
import { EntiteInfo, sortEntiteInfo } from "src/app/core/model/user.model";


@Component({
  selector: 'meg-entite-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './entite-select.component.html',
  styleUrls: ['./entite-select.component.scss'],
})
export class EntiteSelectComponent {
  private readonly _userContextService = inject(UserContextService);
  // Les entites potentiel pour sélection

  private _entitesAvailable: EntiteInfo[] = [];


  @ViewChild('searchEntite') input: ElementRef<HTMLInputElement>;

  // event quand on sélectionne une entité (balise li)
  onSelect = output<EntiteInfo>();

  // event quand on navigue dans l'arbre 
  onNavigate = output<EntiteInfo>();

  entiteSelected = this._userContextService.entiteSelected;

  // Contient une liste ordonnée des parents de l'entité sélectionné (permet de revenir dans l'arbre)
  pathEntite: EntiteInfo[] = []; // liste ordonnée des parents

  // les entités filtré suite à une recherche
  filterEntites: EntiteInfo[] = [];

  constructor() {
    effect(() => {
      if (this.entiteSelected()) {
        this._entitesAvailable = sortEntiteInfo(this.entiteSelected().child);
        this.filterEntites = this._entitesAvailable;
        if (this.pathEntite.length < 1) {
          const parents = this._userContextService.getParentPathEntite(this.entiteSelected());
          this.pathEntite = [...parents, this.entiteSelected()];
        }
      }
    })
  }

  filter() {
    const filterValue = this.input.nativeElement.value.toLowerCase();
    if (filterValue.length > 3) {
      if (!isNaN(Number(filterValue))) { // si numérique, recherche sur siren
        this.filterEntites = this.filterEntites.filter(entite => entite.siren.startsWith(filterValue));
      } else {
        this.filterEntites = this.filterEntites.filter(entite => entite.denomination.toLowerCase().includes(filterValue.toLocaleLowerCase()));
      }

    } else {
      this.filterEntites = this._entitesAvailable;
    }
  }

  /**
   * Action lorsque l'utilisateur sélectionne une entité
   * @param event 
   * @param e l'entité sélectionné
   */
  public selectEntite(event: Event, e: EntiteInfo): void {
    event.preventDefault();
    this._addToPath(e);
    this._entitesAvailable = sortEntiteInfo(e.child);
    this.filterEntites = this._entitesAvailable;
    this._resetInputSeatch();
    this.onSelect.emit(e);
  }

  /**
   * Affiche les enfants de l'entité sélectionné et l'ajoute au path
   */
  public showChild(event: Event, e: EntiteInfo): void {
    this._resetInputSeatch();
    event.preventDefault();
    this._entitesAvailable = e.child;
    this.filterEntites = this._entitesAvailable;
    this._addToPath(e);
  }

  getParent(): EntiteInfo {
    const index = this.pathEntite.length - 2;
    if (index < 0) {
      return this.pathEntite[0];
    }
    return this.pathEntite[index];
  }

  countEntiteAvailable(): number {
    return this._entitesAvailable.length;
  }

  /**
   * Permet de revenir dans l'arbre des entités
   * @param eniteParent 
   */
  backToParent(event: Event, entiteParent: EntiteInfo | null = null): void {
    event.preventDefault();
    if (entiteParent === null) { // si l'entité parent est null, on revient un cran en arrière (donc pop)
      this.pathEntite.pop();
      this._entitesAvailable = sortEntiteInfo(this.pathEntite[this.pathEntite.length - 1].child ?? null);
    } else {
      while (this.pathEntite.length > 0 && this.pathEntite[this.pathEntite.length - 1].id_e !== entiteParent.id_e) {
        this.pathEntite.pop();
      }
      this._entitesAvailable = sortEntiteInfo(entiteParent.child);
      this.onNavigate.emit(entiteParent);
    }
    this.filterEntites = this._entitesAvailable;
  }

  /**
   * Réinit le champ de recherche
   */
  private _resetInputSeatch() {
    if (this.input) this.input.nativeElement.value = "";
  }

  /**
   * Ajoute une entite dans le path complet
   */
  private _addToPath(e: EntiteInfo): void {
    const lastEntite = this.pathEntite[this.pathEntite.length - 1];
    // si le dernier élement est le même que celui à ajouter on ignore
    if (lastEntite.id_e === e.id_e) return;

    // si l'élément à ajouter ne fait pas partie des fils du dernier, on pop
    if (!lastEntite.child.find(c => c.id_e === e.id_e)) {
      this.pathEntite.pop();
    }

    this.pathEntite.push(e);
  }

}
