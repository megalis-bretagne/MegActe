import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from 'src/app/core/services/keycloakServices/auth.service';
import { UserContextService } from 'src/app/core/services/user-context.service';

@Component({
  selector: 'meg-navbar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  private readonly _authService = inject(AuthService);
  currentUser = inject(UserContextService).userCurrent;


  logout(): void {
    this._authService.logout();
  }
}
