import { Component, OnInit } from '@angular/core';
import { UserContext } from 'src/app/model/user.model';
import { AuthService } from 'src/app/services/keycloakServices/auth.service';
import { UserService } from 'src/app/services/userServices/user.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  userContext: UserContext | undefined;

  constructor(private userService: UserService, private authService: AuthService) { }

  ngOnInit(): void {
    this.userService.userContext$.subscribe({
      next: (data: UserContext) => {
        this.userContext = data;
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
