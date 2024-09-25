import { Component, effect, inject, OnInit } from '@angular/core';
import { Acte } from 'src/app/core/model/acte.model';
import { DocCreateInfo } from 'src/app/core/model/document.model';
import { DocumentService } from 'src/app/core/services/document.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { Router, RouterLink } from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { FluxService } from 'src/app/core/services/flux.service';
import { LoadingService } from 'src/app/core/services/loading.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EntiteSelectComponent } from '../entite-select/entite-select.component';
import { EntiteInfo } from 'src/app/core/model/user.model';
import { Modal } from 'flowbite';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule, EntiteSelectComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  private _userContextService = inject(UserContextService);

  entiteSelected = this._userContextService.entiteSelected;
  userFlux = this._userContextService.userFlux
  userCurrent = this._userContextService.userCurrent;
  loadingService = inject(LoadingService);

  fluxSelected = inject(FluxService).fluxSelected /** contient le flux sélectionné */

  actes: Acte[] = [];
  private _modal: Modal | undefined;


  groupedActes: { [key: string]: Acte[]; };
  listType: string[];
  isGroupByType: boolean = false;
  constructor(private logger: NGXLogger, private documentService: DocumentService, private router: Router) {
    effect(() => {
      this.actes = Object.values(this.userFlux());
      this.sortActes();
      this.groupActesByType();
    });
  }
  ngOnInit(): void {
    const modalElement = document.getElementById('modal-select-entite');

    // Initialize the Flowbite modal instance
    if (modalElement) {
      this._modal = new Modal(modalElement, { backdrop: 'dynamic' }, { override: true });
    }
  }

  createDoc(acte: Acte): void {
    this.loadingService.showLoading("Création du document en cours ...");
    const docCreateInfo: DocCreateInfo = {
      entite_id: this.userCurrent().user_info.id_e,
      flux_type: acte.id,
      doc_info: {}
    };

    this.documentService.createDocument(docCreateInfo).subscribe({
      next: (response) => {
        const documentId = response.content.info.id_d;
        this.router.navigate(['/acte', documentId]);
      },
      error: (error) => { this.logger.error('Error creating document:', error); },
    })
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
    this.router.navigate(['/org', e.id_e]);
    //this._userContextService.entiteSelected.set(e);
  }

}
