import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { CheckboxInputComponent } from 'src/app/shared/components/flux/checkbox-input/checkbox-input.component';
import { DateInputComponent } from 'src/app/shared/components/flux/date-input/date-input.component';
import { ExternalDataInputComponent } from 'src/app/shared/components/flux/external-data-input/external-data-input.component';
import { FileUploadComponent } from 'src/app/shared/components/flux/file-upload/file-upload.component';
import { SelectInputComponent } from 'src/app/shared/components/flux/select-input/select-input.component';
import { TextInputComponent } from 'src/app/shared/components/flux/text-input/text-input.component';
import { Data, Field } from 'src/app/core/model/field-form.model';
import { HttpDocumentService } from 'src/app/core/services/http/http-document.service';
import { FieldFluxService } from 'src/app/core/services/field-flux.service';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LoadingComponent } from 'src/app/shared/components/loading-component/loading.component';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { CommonModule } from '@angular/common';
import { DocumentDetail } from 'src/app/core/model/document.model';
import { LoadingService } from 'src/app/core/services/loading.service';
import { HttpFluxService } from 'src/app/core/services/http/http-flux.service';

@Component({
  selector: 'meg-acte-form',
  standalone: true,
  imports: [
    LoadingComponent, ExternalDataInputComponent, FileUploadComponent,
    DateInputComponent, SelectInputComponent, CheckboxInputComponent, TextInputComponent, FormsModule, CommonModule, ReactiveFormsModule
  ],
  templateUrl: './acte-form.component.html',
  styleUrls: ['./acte-form.component.scss']
})
export class ActeFormComponent implements OnInit {
  userContextService = inject(UserContextService);

  fluxSelected = this.userContextService.fluxSelected;
  userCurrent = this.userContextService.userCurrent;
  entiteSelected = this.userContextService.entiteSelected;
  loadingService = inject(LoadingService);

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

  // Formulaire de la step 1
  form: FormGroup = new FormGroup({});
  // Formulaire pour la step 2
  formExternalData: FormGroup = new FormGroup({})

  constructor(
    private route: ActivatedRoute,
    private logger: NGXLogger,
    private fieldFluxService: FieldFluxService,
    private documentService: HttpDocumentService,
    private router: Router,
    private fluxService: HttpFluxService,
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


  onNextStep(): void {
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



  onAssignFileTypesAndSave(): void {
    if (this._checkFormValid(this.formExternalData)) {
      this.loadingService.showLoading("Sauvegarde de l'acte en cours ...");
      const info = this.formExternalData.getRawValue();
      this._assignFileTypes(Object.values(info));
    } else {
      this.globalErrorMessage = 'Veuillez sélectionner tous les types de fichiers requis.';
    }
  }

  sendActe(): void {
    if (this._checkFormValid(this.formExternalData)) {
      this.loadingService.showLoading("Envoi de l'acte en cours ...");

    }
    else {
      this.globalErrorMessage = 'Veuillez sélectionner tous les types de fichiers requis.';
    }
  }

  onPreviousStep() {
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

  goBack(): void {
    this.router.navigate(['/']);
  }

  private _checkFormValid(form: FormGroup): boolean {
    form.markAllAsTouched();
    return form.valid;
  }

  /**
   * Assign les externalData
   * @param data 
   */
  private _assignFileTypes(data: string[]): void {
    this.documentService.patchExternalData(this.entiteSelected().id_e, this.documentInfo.info.id_d, 'type_piece', data).subscribe({
      next: (response) => {
        this.loadingService.showSuccess('Le document a été créé et mis à jour avec succès.', ['/documents', this.acteName]);
        this.logger.info('File types assigned successfully', response);
      },
      error: (error) => {
        this.loadingService.showError(error.error.detail || 'Une erreur est survenue lors de la création ou de la mise à jour du document.');
        this.logger.error('Error assigning file types', error);
      }
    });
  }

  private _save(): void {
    this.loadingService.showLoading("Sauvegarde en cours ...");
    const docUpdateInfo = {
      entite_id: this.entiteSelected().id_e,
      doc_info: this._retrieveInfo()
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
    this.fluxService.get_externalData(this.entiteSelected().id_e, this.documentInfo.info.id_d, 'type_piece').subscribe({
      next: (response) => {
        this.fileTypes = response.actes_type_pj_list;
        this.currentStep.set(2);
        this._buildFormExternalDataForFile(response.pieces, response.actes_type_pj_list)
        this.pieces.set(response.pieces);
        this.loadingService.hideLoading();
      },
      error: (error) => {
        this.logger.error('Error fetching file types and files', error);
      }
    });
  }
}
