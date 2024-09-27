import { Component, inject, OnInit, } from '@angular/core';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { initFlowbite } from 'flowbite';
import { ModalDialogComponent } from './shared/components/modal/meg-modal-dialog.component';
import { UserContextService } from './core/services/user-context.service';



@Component({
  selector: 'meg-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NavbarComponent, RouterModule, ModalDialogComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Megacte';
  userContexteService = inject(UserContextService);
  entiteSelected = this.userContexteService.entiteSelected;

  constructor(private router: Router) { }

  ngOnInit() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        setTimeout(() => { initFlowbite(); })
      }
    });
  }

}

