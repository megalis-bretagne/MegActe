import { Component, OnInit } from '@angular/core';
import { Acte, GroupedActes } from 'src/app/model/acte.model';
import { UserService } from 'src/app/services/userServices/user.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  actes: Acte[] = [];
  groupedActes: GroupedActes[];
  ordreAlphabetique: boolean = true;

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.userService.userFlux$.subscribe({
      next: (data: Acte[]) => {
        this.actes = Object.values(data);
        this.sortActes();
        this.groupActesByType();
      }
    });
  }

  groupActesByType(): void {
    const grouped = this.actes.reduce((acc: { [type: string]: string[] }, acte: Acte) => {
      if (!acc[acte.type]) {
        acc[acte.type] = [];
      }
      acc[acte.type].push(acte.nom);
      return acc;
    }, {});

    this.groupedActes = Object.keys(grouped).map(type => ({
      type,
      nom: grouped[type]
    }));
  }

  sortActes(): void {
    this.actes.sort((a, b) => a.nom.localeCompare(b.nom));
  }

}