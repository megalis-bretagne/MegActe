import { Component, computed, effect, inject, signal } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { DocumentInfo, DocumentPaginate } from 'src/app/model/document.model';
import { DocumentService } from 'src/app/services/document.service';
import { FluxService } from 'src/app/services/flux.service';
import { UserContextService } from 'src/app/services/user-context.service';
import { StateDocumentPipe } from './state-document/state-document.pipe';
import { LoadingTemplateComponent } from '../loading-template/loading-template.component';
import { DatePipe } from '@angular/common';


@Component({
  selector: 'meg-document-list',
  standalone: true,
  imports: [StateDocumentPipe, LoadingTemplateComponent, DatePipe],
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
  documentsPaginate = signal<DocumentPaginate | null>(null);

  documents = computed(() => {
    if (this.documentsPaginate() != null)
      return this.documentsPaginate().documents;
    return []
  });



  is_loading = true;

  constructor(private logger: NGXLogger, private documentService: DocumentService) {
    effect(() => {
      this.is_loading = true;
      const idFlux = this.fluxSelected() !== null ? this.fluxSelected().id : null;
      this.documentService.getDocuments(this.userCurrent().user_info.id_e, idFlux).subscribe({
        next: (documentPaginate: DocumentPaginate) => this.documentsPaginate.set(documentPaginate),
        complete: () => this.is_loading = false
      })
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
