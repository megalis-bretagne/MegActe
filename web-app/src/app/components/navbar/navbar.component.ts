import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from 'src/app/services/keycloakServices/auth.service';
import { UserContextService } from 'src/app/services/user-context.service';
import { EntiteSelectComponent } from '../entite-select/entite-select.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, EntiteSelectComponent],
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
