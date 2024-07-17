import { Component, computed, effect, inject, signal } from '@angular/core';
import { DocumentPaginate } from 'src/app/model/document.model';
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
  itemPerPage = 10;
  pagesToShow = 7;
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

  currentPage = signal(1);

  pagesToDisplay = computed(() => {
    const pages: number[] = [];

    let startPage = Math.max(2, this.currentPage() - 3);
    let endPage = Math.min(this.totalPages() - 1, this.currentPage() + 3);

    if (this.currentPage() <= 4) {
      endPage = Math.min(this.pagesToShow, this.totalPages());
    }

    if (this.currentPage() > this.totalPages() - 4) {
      startPage = Math.max(2, this.totalPages() - this.pagesToShow + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  })


  constructor(private documentService: DocumentService) {
    // effect sur le changement de flux
    effect(() => {
      this.currentPage.set(1);
      this._loadDataPage(this.fluxSelected() !== null ? this.fluxSelected().id : null);
    }, { allowSignalWrites: true })
  }

  /**
   * Controle le changement de page de la pagination
   * @param page 
   * @param event 
   */
  changePage(page: number, event: any = null) {
    if (event != null)
      event.preventDefault();

    if (page < 1 || page > this.totalPages()) this.currentPage.set(1);
    this.currentPage.set(page);
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
