import { Component, computed, inject } from '@angular/core';
import { UserContextService } from 'src/app/core/services/user-context.service';

@Component({
  selector: 'meg-user-profile',
  standalone: true,
  templateUrl: './user-profile.component.html',
  styleUrls: []
})
export class UserProfileComponent {
  currentUser = inject(UserContextService).userCurrent;
  entiteBase = computed(() => {

    if (this.currentUser()?.entites.length > 0) {
      return this.currentUser().entites.find(e => e.id_e === this.currentUser().user_info.id_e) || null;
    }
    return null;
  })
}
