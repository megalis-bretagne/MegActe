import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable } from 'rxjs';
import { UserService } from 'src/app/services/userServices/user.service';
import { UserContext } from 'src/app/model/user.model';
import { Acte } from 'src/app/model/acte.model';

@Injectable({
  providedIn: 'root'
})
export class UserContextResolver implements Resolve<UserContext> {
  constructor(private userService: UserService) { }

  resolve(): Observable<UserContext> {
    return this.userService.getUserContext();
  }
}

@Injectable({
  providedIn: 'root'
})
export class UserFluxResolver implements Resolve<Acte[]> {
  constructor(private userService: UserService) { }

  resolve(): Observable<Acte[]> {
    return this.userService.getUserFlux();
  }
}
