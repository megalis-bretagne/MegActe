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
  currentUser = inject(UserContextService).userCurrent;

  constructor(private authService: AuthService) { }


  logout(): void {
    this.authService.logout();
  }
}
