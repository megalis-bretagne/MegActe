import { Component, effect, inject, output } from "@angular/core";
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
  private _userContextService = inject(UserContextService);

  // event quand on sélectionne une entité (balise li)
  onSelect = output<EntiteInfo>();

  // event quand on navigue dans l'arbre 
  onNavigate = output<EntiteInfo>();

  entiteSelected = this._userContextService.entiteSelected;

  // Contient une liste ordonnée des parents de l'entité sélectionné (permet de revenir dans l'arbre)
  pathEntite: EntiteInfo[] = []; // liste ordonnée des parents

  // Les entites à afficher pour sélection
  entitesToDisplay: EntiteInfo[] = [];

  constructor() {
    effect(() => {
      if (this.entiteSelected()) {
        this.entitesToDisplay = sortEntiteInfo(this.entiteSelected().child);
        if (this.pathEntite.length < 1) {
          const parents = this._userContextService.getParentPathEntite(this.entiteSelected());
          this.pathEntite = [...parents, this.entiteSelected()];
        }
      }
    })
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



  public selectEntite(event: any, e: EntiteInfo): void {
    event.preventDefault();
    this._addToPath(e);
    this.entitesToDisplay = sortEntiteInfo(e.child);
    this.onSelect.emit(e);
  }

  /**
   * Affiche les enfants de l'entité sélectionné et l'ajoute au path
   */
  public showChild(event: any, e: EntiteInfo): void {
    event.preventDefault();
    this.entitesToDisplay = e.child;
    this._addToPath(e);
  }

  getParent(): EntiteInfo {
    const index = this.pathEntite.length - 2;
    if (index < 0) {
      return this.pathEntite[0];
    }
    return this.pathEntite[index];
  }

  /**
   * Permet de revenir dans l'arbre des entités
   * @param eniteParent 
   */
  backToParent(event: any, entiteParent: EntiteInfo | null = null): void {
    event.preventDefault();
    if (entiteParent === null) { // si l'entité parent est null, on revient un cran en arrière (donc pop)
      this.pathEntite.pop();
      this.entitesToDisplay = sortEntiteInfo(this.getParent().child);
    } else {
      while (this.pathEntite.length > 0 && this.pathEntite[this.pathEntite.length - 1].id_e !== entiteParent.id_e) {
        this.pathEntite.pop();
      }
      this.entitesToDisplay = sortEntiteInfo(entiteParent.child);
      this.onNavigate.emit(entiteParent);
    }
  }
}
