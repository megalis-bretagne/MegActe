import { Component, computed, DestroyRef, effect, inject, OnInit, signal } from '@angular/core';
import { ActionPossible, ActionPossibleEnum, DocCreateInfo, DocumentInfo, DocumentPaginate } from 'src/app/core/model/document.model';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { StateDocumentPipe } from '../../pipes/state-document.pipe';
import { LoadingComponent } from '../loading-component/loading.component';
import { DatePipe } from '@angular/common';
import { PaginationComponent } from '../pagination/pagination.component';
import { Router } from '@angular/router';
import { LoadingService } from 'src/app/core/services/loading.service';
import { Modal } from 'flowbite';
import { FormsModule } from '@angular/forms';
import { HttpErrorCustom } from 'src/app/core/model/http-error-custom.model';
import { ActionDocumentComponent } from '../action-document/action-document.component';
import { DocumentService } from 'src/app/core/services/document.service';


@Component({
  selector: 'meg-document-list',
  standalone: true,
  imports: [StateDocumentPipe, PaginationComponent, LoadingComponent, DatePipe, FormsModule, ActionDocumentComponent],
  templateUrl: './document-list.component.html',
  styleUrls: []
})
export class DocumentListComponent implements OnInit {
  itemPerPage = 10;

  loadingService = inject(LoadingService);
  documentService = inject(DocumentService);
  userContextService = inject(UserContextService);
  fluxSelected = this.userContextService.fluxSelected

  private readonly _destroyRef = inject(DestroyRef);


  userCurrent = this.userContextService.userCurrent;
  entiteSelected = this.userContextService.entiteSelected;
  modal_confirm_delete: Modal | undefined;

  // la liste des documents à supprimer
  documents_to_delete = signal<DocumentInfo[]>([]);
  documentsPaginate = signal<DocumentPaginate | null>(null);

  // liste des action en masses
  multiAction = signal<ActionPossible[]>([]);

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

  is_loading = signal<boolean>(true);
  pageActive = signal(1);

  constructor(private readonly _router: Router) {
    // effect sur le changement de flux
    const monEffect = effect(() => {
      this.pageActive.set(1);
      this._loadDataPage(this.fluxSelected() !== null ? this.fluxSelected().id : null);
    }, { allowSignalWrites: true })

    this._destroyRef.onDestroy(() => {
      monEffect.destroy();
    })
  }

  /**
   * Permet d'initialiser la modale
   */
  ngOnInit(): void {
    const modalElement = document.getElementById('confirmDelete');
    if (modalElement) {
      this.modal_confirm_delete = new Modal(modalElement);
    }
  }

  /**
   * Calcul les actions possible quand on sélectionne plusieurs documents
   */
  selectAction(doc: DocumentInfo): void {
    if (doc.action_possible.length === 0) {
      this.multiAction.set([]);
      return; // si aucune actions sur le document, on passe
    }

    // récupération des tableaux d'action possible de chaque document sélectionné
    const actions = this.document_selected
      .map(d => d.action_possible.filter(ap => this.documentService.getActionMultiAuthorize().includes(ap.action as ActionPossibleEnum)));

    if (actions.length === 0) { // si aucune action
      this.multiAction.set([])
    } else {
      let commonElements = new Set(actions[0]);

      // Parcours de tous les tableaux d'actions pour ne conserver que les éléments en commun
      for (let i = 1; i < actions.length; i++) {
        commonElements = new Set(
          [...commonElements].filter(element => actions[i].some(ai => ai.action === element.action))
        );
      }
      this.multiAction.set(Array.from(commonElements));
    }
  }

  /**
   * Controle le changement de page de la pagination
   * @param page 
   * @param event 
   */
  changePage(page: number) {
    this.pageActive.set(page);
    const idFlux = this.fluxSelected() !== null ? this.fluxSelected().id : null
    this._loadDataPage(idFlux, page)
  }


  get document_selected(): DocumentInfo[] {
    return this.documents().filter(doc => doc.selected);
  }

  createDoc(): void {
    if (this.fluxSelected() != null) {
      this.loadingService.showLoading("Création du document en cours ...");

      const docCreateInfo: DocCreateInfo = {
        flux_type: this.fluxSelected().id,
        doc_info: {}
      };

      this.documentService.createDocument(this.entiteSelected().id_e, docCreateInfo).subscribe({
        next: (response) => {
          const documentId = response.info.id_d;
          this._router.navigate(['/org', this.entiteSelected().id_e, 'acte', documentId]);
        }
      })
    }
  }

  goUpdateDoc(document: DocumentInfo): void {
    const flux = this.userContextService.userFlux();
    if (document.type) {
      const acte = flux.find(f => f.id === document.type);
      if (acte.enable) { // si le flux est activé dans megacte
        this.loadingService.showLoading("Chargement du document en cours");
        this._router.navigate(['/org', this.entiteSelected().id_e, 'acte', document.id_d]);
      } else {
        this.documentService.redirectEditToPastell(document);
      }
    }
  }


  confirmDeleteDocuments(documents: DocumentInfo[]): void {
    if (documents.length > 0) {
      this.documents_to_delete.set(documents);
      this.modal_confirm_delete.show();
    }
  }

  cancelDeleteDocuments(): void {
    this.modal_confirm_delete.hide();
    this.documents_to_delete.set([]);
  }

  doDeleteDocuments(): void {
    this.modal_confirm_delete.hide();
    this.loadingService.showLoading("Suppression en cours ...");
    this.documentService.deleteDocuments(this.documents_to_delete().map(doc => doc.id_d), this.entiteSelected().id_e).subscribe({
      next: () => {
        this.loadingService.showSuccess('Les documents ont bien été supprimés', null, () => { this.changePage(this.pageActive()); });
      },
      error: (error: HttpErrorCustom) => this.loadingService.showError("Erreur lors de la suppression. " + error.error.detail),
    })
  }

  /**
   * Check si au moins un document est sélectionné et que tous les documents sélectionné peuvent être supprimé
   * @returns 
   */
  canDeleteMulti(): boolean {
    return this.multiAction().some(action => action.action === ActionPossibleEnum.Suppression);
  }


  /**
   * Check si une checkbox de multi selection peut être disponible pour le document
   * @param doc le document
   * @returns 
   */
  displayCheckBox(doc: DocumentInfo): boolean {
    return this.documentService.canDelete(doc) || this.documentService.canSendToTdt(doc);
  }

  /**
   * Lancement une action sur le document
   * @param document le document
   * @param action le nom de laction
   */
  runAction(document: DocumentInfo, action: ActionPossible) {

    if (action.action === ActionPossibleEnum.Suppression) {
      this.confirmDeleteDocuments([document]);
    } else if (action.action === ActionPossibleEnum.Modification) {
      this.goUpdateDoc(document);
    }
    else {
      this.documentService.launchActionOnDocument(this.entiteSelected().id_e, document, action)
    }
  }

  runActionMulti(documents: DocumentInfo[], action: ActionPossible) {

    if (action.action === ActionPossibleEnum.Suppression) {
      this.confirmDeleteDocuments(documents);
    } else {
      this.documentService.launchActionOnMultiDocuments(this.entiteSelected().id_e, documents, action)
    }
  }

  private _loadDataPage(idflux: string, page: number = 1) {
    this.is_loading.set(true);
    if (page < 1) page = 1

    this.documentService.getDocuments(this.entiteSelected().id_e, idflux, (page - 1) * this.itemPerPage, this.itemPerPage).subscribe({
      next: (documentPaginate: DocumentPaginate) => this.documentsPaginate.set(documentPaginate),
      complete: () => this.is_loading.set(false)
    })
  }
}