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
import { FieldFluxService } from 'src/app/core/services/field-flux.service';
import { LoadingComponent } from 'src/app/shared/components/loading-component/loading.component';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { CommonModule } from '@angular/common';
import { DocumentDetail } from 'src/app/core/model/document.model';
import { DocumentService } from 'src/app/core/services/document.service';

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
  private readonly _fieldFluxService = inject(FieldFluxService);

  userContextService = inject(UserContextService);
  documentService = inject(DocumentService);

  fluxSelected = this.userContextService.fluxSelected;
  userCurrent = this.userContextService.userCurrent;
  entiteSelected = this.userContextService.entiteSelected;

  acteName: string;
  fluxDetail: Data;
  // Le document à créer éditer
  documentInfo: DocumentDetail;
  fields: Field[] = [];
  filteredFields: Field[] = [];
  fileTypes: { [key: string]: string } = {};
  pieces = signal<string[]>([]);
  fileTypeField: Field | undefined = undefined;

  currentStep = signal<number>(1);
  globalErrorMessage: string;
  fileFields: Field[] = [];

  hasStepTdt: boolean = false;

  formValues: { [idField: string]: string } = {};

  // Formulaire de la step 1
  form: FormGroup = new FormGroup({});
  // Formulaire pour la step 2
  formExternalData: FormGroup = new FormGroup({})

  constructor(
    private readonly _route: ActivatedRoute,
    private readonly _logger: NGXLogger,
    private readonly _router: Router,
  ) {

    this._route.data.subscribe(data => {
      this.fluxDetail = data['docDetail'].flux;
      this.documentInfo = data['docDetail'].document as DocumentDetail;

      if (this.fluxDetail) {
        this.fields = this._fieldFluxService.extractFields(this.fluxDetail);
        this.filteredFields =
          this._fieldFluxService.filterFields(this.fields)
            .filter(field => field.idField !== 'type_piece');
        this.fileFields = this.filteredFields.filter(field => field.type === 'file');

        this.fileTypeField = this._fieldFluxService.getFieldTdt(this.fields);
      } else {
        this._logger.error('Flux detail not found for the given acte');
      }
    });
  }


  ngOnInit(): void {
    this.acteName = this.fluxSelected().nom;

    this.filteredFields.forEach(field => {
      const value = this.documentInfo.data[field.idField] ?? null;
      this.form.addControl(field.idField, new FormControl(value));
    })

    this.hasStepTdt = this.fileTypeField !== undefined;
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

  private _retrieveInfo(): { [key: string]: boolean | string | number | Date } {
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
      const info = this.formExternalData.getRawValue();
      this.documentService.updateTypePiece(this.entiteSelected().id_e, this.documentInfo.info.id_d, Object.values(info)).subscribe();
    } else {
      this.globalErrorMessage = 'Veuillez sélectionner tous les types de fichiers requis.';
    }
  }

  sendActe(): void {
    if (this._checkFormValid(this.formExternalData)) {
      const info = this.formExternalData.getRawValue();
      const updateTypePiece$ = this.documentService.updateTypePiece(this.entiteSelected().id_e, this.documentInfo.info.id_d, Object.values(info), false);

      updateTypePiece$.subscribe({
        next: () => {
          this.documentService.sendActe(this.entiteSelected().id_e, this.documentInfo);
        }
      })
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
    this._router.navigate(['/']);
  }

  private _checkFormValid(form: FormGroup): boolean {
    form.markAllAsTouched();
    return form.valid;
  }

  private _save(): void {

    const docUpdateInfo = {
      entite_id: this.entiteSelected().id_e,
      doc_info: this._retrieveInfo()
    };

    this.documentService.updateDocument(this.entiteSelected().id_e, this.documentInfo.info.id_d, docUpdateInfo).subscribe({
      next: (response) => {
        this.fileTypes = response['actes_type_pj_list'] as { [key: string]: string };
        this.currentStep.set(2);
        this._buildFormExternalDataForFile(response['pieces'] as string[], response['actes_type_pj_list'] as { [key: string]: string })
        this.pieces.set(response['pieces'] as string[]);
      },
      error: (error) => {
        this._logger.error('Error updating document', error);
      }
    }
    )
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

}
