import { Component, effect, inject, signal } from '@angular/core';
import { Acte } from 'src/app/model/acte.model';
import { DocCreateInfo } from 'src/app/model/document.model';
import { DocumentService } from 'src/app/services/document.service';
import { SharedDataService } from 'src/app/services/sharedData.service';
import { UserContextService } from 'src/app/services/user-context.service';
import { Router } from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { FluxService } from 'src/app/services/flux.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  userFlux = inject(UserContextService).userFlux

  fluxSelected = inject(FluxService).fluxSelected /** contient le flux sélectionné */

  actes: Acte[] = [];

  groupedActes: { [key: string]: Acte[]; };
  listType: string[];
  groupByType: boolean = false;
  constructor(private sharedDataService: SharedDataService, private logger: NGXLogger, private documentService: DocumentService, private router: Router) {
    effect(() => {
      this.actes = Object.values(this.userFlux());
      this.sortActes();
      this.groupActesByType();
    })

  }

  createDoc(acte: Acte): void {
    const docCreateInfo: DocCreateInfo = {
      entite_id: this.sharedDataService.getUser().user_info.id_e,
      flux_type: acte.type,
      doc_info: {}
    };

    this.documentService.createDocument(docCreateInfo).subscribe(
      (response) => {
        const documentId = response.content.info.id_d;
        this.router.navigate(['/acte', acte.nom, { documentId }]);
      },
      (error) => {
        this.logger.error('Error creating document:', error);
      }
    );
  }

  selectFlux(acte: Acte) {
    this.fluxSelected.set(acte);
  }

  groupActesByType(): void {
    this.groupedActes = this.actes.reduce((acc, acte) => {
      if (!acc[acte.type]) {
        acc[acte.type] = [];
      }
      acc[acte.type].push(acte);
      return acc;
    }, {} as { [key: string]: Acte[] });

    this.listType = Object.keys(this.groupedActes);

  }


  sortActes(): void {
    this.actes.sort((a, b) => a.nom.localeCompare(b.nom));
  }

}
