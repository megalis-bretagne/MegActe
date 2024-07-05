import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { Acte, GroupedActes } from 'src/app/model/acte.model';
import { DocCreateInfo } from 'src/app/model/document.model';
import { DocumentService } from 'src/app/services/document.service';
import { SharedDataService } from 'src/app/services/sharedData.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  actes: Acte[] = [];
  groupedActes: GroupedActes[];
  ordreAlphabetique: boolean = true;

  constructor(private sharedDataService: SharedDataService, private logger: NGXLogger, private documentService: DocumentService, private router: Router) { }

  ngOnInit(): void {
    this.actes = Object.values(this.sharedDataService.getFlux());
    this.sortActes();
    this.groupActesByType();
  }

  createDoc(acteNom: string): void {
    const docCreateInfo: DocCreateInfo = {
      entite_id: this.sharedDataService.getUser().user_info.id_e,
      flux_type: this.sharedDataService.getFieldByName(acteNom),
      doc_info: {}
    };

    this.documentService.createDocument(docCreateInfo).subscribe(
      (response) => {
        const documentId = response.content.info.id_d;
        this.router.navigate(['/acte', acteNom, { documentId }]);
      },
      (error) => {
        this.logger.error('Error creating document:', error);
      }
    );

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
