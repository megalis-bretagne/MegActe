import { Component, computed, inject, OnInit } from '@angular/core';
import { Flux } from 'src/app/core/model/flux.model';
import { DocCreateInfo } from 'src/app/core/model/document.model';
import { HttpDocumentService } from 'src/app/core/services/http/http-document.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { Router, RouterLink } from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { LoadingService } from 'src/app/core/services/loading.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EntiteSelectComponent } from '../entite-select/entite-select.component';
import { EntiteInfo } from 'src/app/core/model/user.model';
import { Modal } from 'flowbite';


@Component({
  selector: 'meg-sidebar',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule, EntiteSelectComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  private readonly _userContextService = inject(UserContextService);
  private readonly _documentService = inject(HttpDocumentService);
  private readonly _logger = inject(NGXLogger);
  private readonly _router = inject(Router);
  private _modal: Modal | undefined;

  loadingService = inject(LoadingService);
  entiteSelected = this._userContextService.entiteSelected;
  userFlux = this._userContextService.userFlux
  userCurrent = this._userContextService.userCurrent;

  fluxSelected = this._userContextService.fluxSelected /** contient le flux sélectionné */

  flux = computed(() => {
    if (this.userFlux() != null)
      return this.userFlux().sort((a1: Flux, a2: Flux) => a1.nom.localeCompare(a2.nom));
    return []
  });

  groupedFlux: { [key: string]: Flux[]; };
  listType: string[];
  isGroupByType: boolean = false;


  ngOnInit(): void {
    const modalElement = document.getElementById('modal-select-entite');

    // Initialize the Flowbite modal instance
    if (modalElement) {
      this._modal = new Modal(modalElement, { backdrop: 'dynamic' }, { override: true });
    }
  }

  createDoc(flux: Flux): void {
    this.loadingService.showLoading("Création du document en cours ...");
    const docCreateInfo: DocCreateInfo = {
      flux_type: flux.id,
      doc_info: {}
    };

    this._documentService.createDocument(this.userCurrent().user_info.id_e, docCreateInfo).subscribe({
      next: (response) => {
        const documentId = response.info.id_d;
        this._router.navigate(['/org', this.entiteSelected().id_e, 'acte', documentId]);
      },
      error: (error) => { this._logger.error('Error creating document:', error); },
    })
  }


  groupFluxByType(): void {
    this.groupedFlux = this.flux().reduce((acc, acte) => {
      if (!acc[acte.type]) {
        acc[acte.type] = [];
      }
      acc[acte.type].push(acte);
      return acc;
    }, {} as { [key: string]: Flux[] });

    this.listType = Object.keys(this.groupedFlux);

  }

  showSelectEntite(): void {
    this._modal.show();
  }

  hideSelectEntite(): void {
    this._modal.hide();
  }

  selectEntite(e: EntiteInfo, close_modal = true) {
    if (close_modal) {
      this.hideSelectEntite();
    }
    this._router.navigate(['/org', e.id_e]);
  }

}
