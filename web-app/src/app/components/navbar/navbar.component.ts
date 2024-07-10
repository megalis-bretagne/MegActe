import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/keycloakServices/auth.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  currentUser = inject(UserService).userCurrent;

  constructor(private authService: AuthService) { }


  logout(): void {
    this.authService.logout();
  }
}
