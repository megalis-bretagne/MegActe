import { Component, computed, effect, inject, signal } from '@angular/core';
import { DocCreateInfo, DocumentPaginate } from 'src/app/model/document.model';
import { DocumentService } from 'src/app/services/document.service';
import { FluxService } from 'src/app/services/flux.service';
import { UserContextService } from 'src/app/services/user-context.service';
import { StateDocumentPipe } from './state-document/state-document.pipe';
import { LoadingTemplateComponent } from '../loading-template/loading-template.component';
import { DatePipe } from '@angular/common';
import { PaginationComponent } from '../pagination/pagination.component';
import { Router } from '@angular/router';


@Component({
  selector: 'meg-document-list',
  standalone: true,
  imports: [StateDocumentPipe, PaginationComponent, LoadingTemplateComponent, DatePipe],
  templateUrl: './document-list.component.html',
})
export class DocumentListComponent {
  itemPerPage = 10;
  fluxSelected = inject(FluxService).fluxSelected

  //TODO a modifier quand le changement d'id_e sera possible
  userCurrent = inject(UserContextService).userCurrent;

  entiteSelected = computed(() => {
    if (this.userCurrent() != null) {
      return this.userCurrent().user_info.id_e;
    }
    return null;
  })


  documentsPaginate = signal<DocumentPaginate | null>(null);

  /**
   * Liste des documents
   */
  documents = computed(() => {
    if (this.documentsPaginate() != null)
      return this.documentsPaginate().documents;
    return []
  });

  totalPages = computed(() => {
    if (this.documentsPaginate() != null)
      return Math.ceil(this.documentsPaginate().pagination.total / this.itemPerPage);
    return 0;
  })

  is_loading = true;
  pageActive = signal(1);

  constructor(private documentService: DocumentService, private router: Router) {
    // effect sur le changement de flux
    effect(() => {
      this.pageActive.set(1);
      this._loadDataPage(this.fluxSelected() !== null ? this.fluxSelected().id : null);
    }, { allowSignalWrites: true })
  }

  /**
   * Controle le changement de page de la pagination
   * @param page 
   * @param event 
   */
  changePage(page: number) {
    const idFlux = this.fluxSelected() !== null ? this.fluxSelected().id : null
    this._loadDataPage(idFlux, page)
  }

  private _loadDataPage(idflux: string, page: number = 1) {
    this.is_loading = true;
    if (page < 1) page = 1

    this.documentService.getDocuments(this.userCurrent().user_info.id_e, idflux, (page - 1) * this.itemPerPage, this.itemPerPage).subscribe({
      next: (documentPaginate: DocumentPaginate) => this.documentsPaginate.set(documentPaginate),
      complete: () => this.is_loading = false
    })
  }

  createDoc(): void {
    if (this.fluxSelected() != null) {


      const docCreateInfo: DocCreateInfo = {
        entite_id: this.userCurrent().user_info.id_e,
        flux_type: this.fluxSelected().id,
        doc_info: {}
      };

      this.documentService.createDocument(docCreateInfo).subscribe({
        next: (response) => {
          const documentId = response.content.info.id_d;
          this.router.navigate(['/acte', documentId]);
        }
      })
    }
  }
}