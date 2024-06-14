import { Component, OnInit } from '@angular/core';
import { UserContext } from 'src/app/model/user.model';
import { AuthService } from 'src/app/services/keycloakServices/auth.service';
import { SharedDataService } from 'src/app/services/sharedData.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  userContext: UserContext;

  constructor(private sharedDataService: SharedDataService, private authService: AuthService) { }

  ngOnInit(): void {
    this.userContext = this.sharedDataService.getUser();
  }

  logout(): void {
    this.authService.logout();
  }
}
