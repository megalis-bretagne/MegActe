import { Component, inject, OnInit, } from '@angular/core';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { initFlowbite } from 'flowbite';
import { ModalDialogComponent } from './shared/components/modal/meg-modal-dialog.component';
import { UserContextService } from './core/services/user-context.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'meg-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NavbarComponent, RouterModule, ModalDialogComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [
    trigger('slideInOut', [
      state('void', style({
        transform: 'translateX(-100%)', // Initialement hors de l'écran
      })),
      transition(':enter', [
        animate('300ms ease-in', style({
          transform: 'translateX(0)', // Se déplace vers l'écran
        }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({
          transform: 'translateX(-100%)', // Se déplace hors de l'écran
        }))
      ])
    ])
  ]

})
export class AppComponent implements OnInit {
  private readonly _router = inject(Router);

  title = 'Megacte';
  userContexteService = inject(UserContextService);
  entiteSelected = this.userContexteService.entiteSelected;
  isSidebarVisible = true


  ngOnInit() {
    this._router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        setTimeout(() => { initFlowbite(); })
      }
    });
  }

  toogleNavBar() {
    this.isSidebarVisible = !this.isSidebarVisible;
  }
}

