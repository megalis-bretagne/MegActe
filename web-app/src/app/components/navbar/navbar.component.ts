import { Component, OnInit } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
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

  constructor(private userService: UserService, private authService: AuthService, private logger: NGXLogger) { }

  ngOnInit(): void {
    this.userService.getUserContext().subscribe(
      (data: UserContext) => {
        this.userContext = data;
      },
      (error) => {
        this.logger.error('Error fetching user context', error);
      }
    );
  }

  logout(): void {
    this.authService.logout();
  }
}
