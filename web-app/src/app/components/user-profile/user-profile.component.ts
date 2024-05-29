import { Component } from '@angular/core';
import { UserContext } from 'src/app/model/user.model';
import { UserService } from 'src/app/services/userServices/user.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent {
  userContext: UserContext | undefined;

  constructor(private userService: UserService) { }

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
}
