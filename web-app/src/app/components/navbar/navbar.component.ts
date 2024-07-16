import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/keycloakServices/auth.service';
import { UserContextService } from 'src/app/services/user-context.service';

@Component({
  selector: 'app-navbar',
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
