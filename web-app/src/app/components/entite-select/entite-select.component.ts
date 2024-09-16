import { Component, computed, effect, inject, output } from "@angular/core";
import { UserContextService } from "src/app/services/user-context.service";
import { CommonModule } from "@angular/common";
import { EntiteInfo } from "src/app/model/user.model";


@Component({
  selector: 'meg-entite-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './entite-select.component.html',
  styleUrls: ['./entite-select.component.scss'],
})
export class EntiteSelectComponent {

  private _userContextService = inject(UserContextService);

  onSelect = output<EntiteInfo>();

  userCurrent = this._userContextService.userCurrent;

  entiteSelected = this._userContextService.entiteSelected;


  entites = computed(() => {
    if (this.userCurrent()?.entites.length > 0) {
      return this.userCurrent().entites;
    } else {
      return [];
    }
  })

  // Les entites à choisir
  entitesToDisplay: EntiteInfo[] = [];

  constructor() {
    effect(() => {
      this.entitesToDisplay = this.entiteSelected().child;
    })
  }




  public selectEntite(e: EntiteInfo): void {
    // TODO Close la modal
    this.onSelect.emit(e);
  }
}