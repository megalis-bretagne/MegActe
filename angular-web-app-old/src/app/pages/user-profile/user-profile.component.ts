import { Component, computed, inject } from '@angular/core';
import { UserContextService } from 'src/app/core/services/user-context.service';

@Component({
  selector: 'meg-user-profile',
  standalone: true,
  templateUrl: './user-profile.component.html',
  styleUrls: []
})
export class UserProfileComponent {
  private readonly _contexteService = inject(UserContextService)
  currentUser = this._contexteService.userCurrent;

  isSuperAdmin = this._contexteService.isSuperAdmin();

  entiteBase = computed(() => {
    if (!this.isSuperAdmin) {
      return this.currentUser().entite;
    }
    return null;
  })
}
