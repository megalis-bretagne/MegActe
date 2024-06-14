import { Component, OnInit } from '@angular/core';
import { UserContext } from 'src/app/model/user.model';
import { AuthService } from 'src/app/services/keycloakServices/auth.service';
import { AppInitService } from 'src/environments/app.init.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  userContext: UserContext;

  constructor(private appInitService: AppInitService, private authService: AuthService) { }

  ngOnInit(): void {
    this.userContext = this.appInitService.user;
  }

  logout(): void {
    this.authService.logout();
  }
}
