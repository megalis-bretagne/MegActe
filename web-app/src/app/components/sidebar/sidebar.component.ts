import { Component, OnInit } from '@angular/core';
import { Acte, GroupedActes } from 'src/app/model/acte.model';
import { UserService } from 'src/app/services/userServices/user.service';
import { NGXLogger } from 'ngx-logger';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  actes: Acte[] = [];
  groupedActes: GroupedActes[];
  ordreAlphabetique: boolean = true;

  constructor(private userService: UserService, private logger: NGXLogger) { }

  ngOnInit(): void {
    this.userService.getUserFlux().subscribe(
      (data: Acte[]) => {
        this.actes = data;
        this.sortActes();
        this.groupActesByType();
      },
      (error) => {
        this.logger.error('Error fetching user flux', error);
      },
      () => {
        this.logger.info('User flux fetching completed');
      }
    );
  }

  groupActesByType(): void {
    this.groupedActes = Object.values(
      this.actes.reduce((acc: { [type: string]: GroupedActes }, acte: Acte) => {
        const existingGroup = acc[acte.type];
        if (!existingGroup) {
          acc[acte.type] = { type: acte.type, nom: [acte.nom] };
        } else {
          existingGroup.nom.push(acte.nom);
        }
        return acc;
      }, {})
    );
  }

  sortActes(): void {
    this.actes.sort((a, b) => a.nom.localeCompare(b.nom));
  }

}