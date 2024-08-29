import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { CheckboxInputComponent } from 'src/app/components/flux/checkbox-input/checkbox-input.component';
import { DateInputComponent } from 'src/app/components/flux/date-input/date-input.component';
import { ExternalDataInputComponent } from 'src/app/components/flux/external-data-input/external-data-input.component';
import { FileUploadComponent } from 'src/app/components/flux/file-upload/file-upload.component';
import { SelectInputComponent } from 'src/app/components/flux/select-input/select-input.component';
import { TextInputComponent } from 'src/app/components/flux/text-input/text-input.component';
import { Data, Field } from 'src/app/model/field-form.model';
import { DocumentService } from 'src/app/services/document.service';
import { FieldFluxService } from 'src/app/services/field-flux.service';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LoadingComponent } from 'src/app/components/loading-component/loading.component';
import { FluxService } from 'src/app/services/flux.service';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserContextService } from 'src/app/services/user-context.service';
import { CommonModule } from '@angular/common';
import { DocumentDetail } from 'src/app/model/document.model';
import { LoadingService } from 'src/app/services/loading.service';

@Component({
  selector: 'app-acte-form',
  standalone: true,
  imports: [
    LoadingComponent, ExternalDataInputComponent, FileUploadComponent,
    DateInputComponent, SelectInputComponent, CheckboxInputComponent, TextInputComponent, FormsModule, CommonModule, ReactiveFormsModule
  ],
  templateUrl: './acte-form.component.html',
  styleUrls: ['./acte-form.component.scss']
})
export class ActeFormComponent implements OnInit {
  fluxSelected = inject(FluxService).fluxSelected;
  userCurrent = inject(UserContextService).userCurrent;

  acteName: string;
  fluxDetail: Data;
  // Le document à créer éditer
  documentInfo: DocumentDetail;
  fields: Field[] = [];
  filteredFields: Field[] = [];
  fileTypes: { [key: string]: string } = {};
  pieces = signal<string[]>([]);
  fileTypeField: Field;

  currentStep = signal<number>(1);
  globalErrorMessage: string;
  isReadOnly: boolean = false;
  fileFields: Field[] = [];

  formValues: { [idField: string]: any } = {};

  // @TODO, revoir le mécanisme des steps pour faire un composant par steps
  // Formulaire de la step 1
  form: FormGroup = new FormGroup({});
  // Formulaire pour la step 2
  formExternalData: FormGroup = new FormGroup({})

  constructor(
    private route: ActivatedRoute,
    private logger: NGXLogger,
    private fieldFluxService: FieldFluxService,
    private documentService: DocumentService,
    private loadingservice: LoadingService,
    private router: Router,
    private fluxService: FluxService,
  ) {

    this.route.data.subscribe(data => {
      this.fluxDetail = data['docDetail'].flux;
      this.documentInfo = data['docDetail'].document as DocumentDetail;
      const flowId = this.documentInfo.info.type;

      if (this.fluxDetail) {
        this.fields = this.fieldFluxService.extractFields(this.fluxDetail);
        this.filteredFields =
          this.fieldFluxService.filterFields(this.fields, flowId)
            .filter(field => field.idField !== 'type_piece');
        this.fileFields = this.filteredFields.filter(field => field.type === 'file');

        this.fileTypeField = this.fields.find(field => field.idField === 'type_piece');
        if (this.documentInfo['last_action'].action !== 'modification' && this.documentInfo['last_action'].action !== 'creation') {
          this.isReadOnly = true;
        }
      } else {
        this.logger.error('Flux detail not found for the given acte');
      }
    });
  }


  ngOnInit(): void {
    this.acteName = this.fluxSelected().nom;

    this.filteredFields.forEach(field => {
      const value = this.documentInfo.data[field.idField] ?? null;
      this.form.addControl(field.idField, new FormControl(value));
    })
  }

  getFormControl(name: string): FormControl {
    return this.form.get(name) as FormControl;
  }

  getFormControlExternal(index: number | string): FormControl {
    return this.formExternalData.get(index.toString()) as FormControl;
  }


  onNextStepClick(): void {
    if (this.validateForm()) {
      this.globalErrorMessage = '';
      this._save();
    } else {
      this.globalErrorMessage = 'Veuillez remplir tous les champs requis correctement.';
    }
  }

  private _retrieveInfo(): any {
    const docInfo = this.form.getRawValue();
    Object.keys(docInfo).forEach(key => {
      // Conditions pour supprimer une clé :
      // Ici on supprime les champs qui sont de type file
      if (this.fileFields.find(field => field.idField === key)) {
        delete docInfo[key];
      }
    });
    return docInfo;
  }

  private _save(): void {
    this.loadingservice.showLoading();
    const docInfo = this._retrieveInfo();
    const docUpdateInfo = {
      entite_id: this.userCurrent().user_info.id_e,
      doc_info: docInfo
    };

    // Création d'un observable pour la mise à jour du document
    const updateDocument$ = this.documentService.updateDocument(this.documentInfo.info.id_d, docUpdateInfo).pipe(
      catchError(error => {
        this.logger.error('Error updating document', error);
        return of(null);
      })
    );

    updateDocument$.subscribe({
      next: () => {
        this._fetchExternalDataByFile();
      },
      error: (error) => {
        this.logger.error('Error updating document', error);
      }
    });
  }

  /**
   * Construit le formulaire de la seconde étape.
   * @param doc_info les données du document mise à jours
   * @param types 
   */
  private _buildFormExternalDataForFile(files: string[], externalDataValue: { [key: string]: string }) {
    this.formExternalData = new FormGroup({});
    const valueTypePiece = this.documentInfo.data.type_piece_fichier || [];
    const entriesExternalData = Object.entries(externalDataValue);
    files.forEach((file: string, idx: number) => {
      const valueString = valueTypePiece.find(piece => piece.filename === file)?.typologie || undefined;
      const valueKey = valueString ? entriesExternalData.find(([_key, val]) => val === valueString)[0] : null;
      this.formExternalData.addControl(idx.toString(), new FormControl(valueKey))
    });
  }

  private _fetchExternalDataByFile(): void {
    //TODO changer pour la sélection d'entite
    const entiteId = this.userCurrent().user_info.id_e;
    this.fluxService.get_externalData(entiteId, this.documentInfo.info.id_d, 'type_piece').subscribe({
      next: (response) => {
        this.fileTypes = response.actes_type_pj_list;
        this.currentStep.set(2);
        this._buildFormExternalDataForFile(response.pieces, response.actes_type_pj_list)
        this.pieces.set(response.pieces);
        this.loadingservice.hideLoading();
      },
      error: (error) => {
        this.logger.error('Error fetching file types and files', error);
      }
    });
  }

  isFormFileTypesValid() {
    return false;
  }

  onAssignFileTypesClick(): void {
    this.formExternalData.markAllAsTouched();
    if (this.formExternalData.valid) {
      this.loadingservice.showLoading();
      const info = this.formExternalData.getRawValue();
      this._assignFileTypes(Object.values(info));
    } else {
      this.globalErrorMessage = 'Veuillez sélectionner tous les types de fichiers requis.';
    }
  }

  private _assignFileTypes(data: string[]): void {
    this.documentService.patchExternalData(this.userCurrent().user_info.id_e, this.documentInfo.info.id_d, 'type_piece', data).subscribe({
      next: (response) => {
        this.loadingservice.showSuccess('Le document a été créé et mis à jour avec succès.', ['/documents', this.acteName]);
        this.logger.info('File types assigned successfully', response);
      },
      error: (error) => {
        this.loadingservice.showError(error.error.detail || 'Une erreur est survenue lors de la création ou de la mise à jour du document.');
        this.logger.error('Error assigning file types', error);
      }
    });
  }

  onPreviousStepClick() {
    this.currentStep.set(1);
  }

  validateForm(): boolean {
    this.globalErrorMessage = '';
    this.form.markAllAsTouched();

    if (!this.form.valid) {
      this.globalErrorMessage = 'Veuillez remplir tous les champs requis correctement.';
    }

    return this.form.valid;
  }


  scheduleRedirect(): void {
    setTimeout(() => {
      this.router.navigate(['/documents', this.acteName]);
    }, 3000);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
