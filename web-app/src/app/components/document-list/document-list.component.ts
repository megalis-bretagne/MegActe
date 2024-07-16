import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { DocCreateInfo, DocumentInfo } from 'src/app/model/document.model';
import { DocumentService } from 'src/app/services/document.service';
import { FluxService } from 'src/app/services/flux.service';
import { SharedDataService } from 'src/app/services/sharedData.service';
import { UserContextService } from 'src/app/services/user-context.service';

@Component({
  selector: 'meg-document-list',
  standalone: true,
  imports: [],
  templateUrl: './document-list.component.html',
})
export class DocumentListComponent {
  fluxSelected = inject(FluxService).fluxSelected

  //TODO a modifier quand le changement d'id_e sera possible
  userCurrent = inject(UserContextService).userCurrent;

  entiteSelected = computed(() => {
    if (this.userCurrent() != null) {
      return this.userCurrent().user_info.id_e;
    }
    return null;
  })

  /**
   * Liste des documents
   */
  documentList = signal<DocumentInfo[]>([]);

  constructor(private logger: NGXLogger, private documentService: DocumentService) {
    effect(() => {
      // TODO select API document
    })

  }


  createDoc(): void {
    // const docCreateInfo: DocCreateInfo = {
    //   entite_id: this.sharedDataService.getUser().user_info.id_e,
    //   flux_type: this.sharedDataService.getFieldByName(this.typeNom),
    //   doc_info: {}
    // };

    // this.documentService.createDocument(docCreateInfo).subscribe(
    //   (response) => {
    //     const documentId = response.content.info.id_d;
    //     this.router.navigate(['/acte', this.typeNom, { documentId }]);
    //   },
    //   (error) => {
    //     this.logger.error('Error creating document:', error);
    //   }
    // );
  }

}
