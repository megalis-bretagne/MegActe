import { Component } from '@angular/core';
import { UserService } from './services/user.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FluxService } from './services/flux.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Megacte';

  constructor(private userService: UserService, private fluxService: FluxService) {
    this.userService.getUser().pipe(takeUntilDestroyed()).subscribe();
    this.userService.getUserFlux().pipe(takeUntilDestroyed()).subscribe();
  }
}

