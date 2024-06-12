import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Observable } from 'rxjs';
import { UserService } from 'src/app/services/userServices/user.service';
import { UserContext } from 'src/app/model/user.model';
import { Acte } from 'src/app/model/acte.model';

export const UserContextResolver: ResolveFn<UserContext> = (
  route,
  state
): Observable<UserContext> => {
  const userService = inject(UserService);
  return userService.getUserContext();
};


export const UserFluxResolver: ResolveFn<Acte[]> = (
  route,
  state
): Observable<Acte[]> => {
  const userService = inject(UserService);
  return userService.getUserFlux();
};

