import { Component, effect, inject } from '@angular/core';
import { Acte } from 'src/app/model/acte.model';
import { DocCreateInfo } from 'src/app/model/document.model';
import { DocumentService } from 'src/app/services/document.service';
import { SharedDataService } from 'src/app/services/sharedData.service';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';
import { NGXLogger } from 'ngx-logger';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  userFlux = inject(UserService).userFlux

  actes: Acte[] = [];

  groupedActes: { [key: string]: Acte[]; };
  groupByType: boolean = false;
  constructor(private sharedDataService: SharedDataService, private logger: NGXLogger, private documentService: DocumentService, private router: Router) {
    effect(() => {
      this.actes = Object.values(this.userFlux());
      this.sortActes();
      this.groupActesByType();
    })

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
        this.router.navigate(['/acte', documentId]);
        this.sharedDataService.setActeID(acteNom);
      },
      (error) => {
        this.logger.error('Error creating document:', error);
      }
    );
  }

  groupActesByType(): void {
    this.groupedActes = this.actes.reduce((acc, acte) => {
      if (!acc[acte.type]) {
        acc[acte.type] = [];
      }
      acc[acte.type].push(acte);
      return acc;
    }, {} as { [key: string]: Acte[] });

  }

  getKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  sortActes(): void {
    this.actes.sort((a, b) => a.nom.localeCompare(b.nom));
  }

}
