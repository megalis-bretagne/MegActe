import { Component } from '@angular/core';
import { UserContext } from 'src/app/model/user.model';
import { AuthService } from 'src/app/services/keycloakServices/auth.service';
import { UserService } from 'src/app/services/userServices/user.service';


@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  userContext: UserContext | undefined;

  constructor(private userService: UserService, private authService: AuthService) { }

  ngOnInit(): void {
    this.userService.getUserContext().subscribe(
      (data: UserContext) => {
        this.userContext = data;
      },
      (error) => {
        console.error('Error fetching user context', error);
      }
    );
  }

  logout(event: Event): void {
    event.preventDefault();
    this.authService.logout();
  }
}
