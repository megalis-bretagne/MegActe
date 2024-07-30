import { Component, effect, inject, QueryList, ViewChildren, signal } from '@angular/core';
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
import { Observable, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LoadingComponent } from 'src/app/components/loading-component/loading.component';
import { FluxService } from 'src/app/services/flux.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserContextService } from 'src/app/services/user-context.service';
import { CommonModule } from '@angular/common';
import { DocumentInfo } from 'src/app/model/document.model';

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
export class ActeFormComponent {
  fluxSelected = inject(FluxService).fluxSelected;
  userCurrent = inject(UserContextService).userCurrent;

  acteName: string;
  fluxDetail: Data;
  documentInfo: DocumentInfo;
  fields: Field[] = [];
  filteredFields: Field[] = [];
  documentId: string;
  fileTypes: { [key: string]: string } = {};
  pieces = signal<string[]>([]);
  selectedTypes: string[] = [];
  file_type_field: Field;

  currentStep = 1;
  globalErrorMessage: string;
  isFormValid = true;
  isformSubmitted: boolean = false;
  isTypoSuccess: boolean = null;
  isLoading = false;
  isSaving = false;
  modalMessage: string;

  formValues: { [idField: string]: any } = {};

  @ViewChildren(TextInputComponent) textInputs: QueryList<TextInputComponent>;
  @ViewChildren(CheckboxInputComponent) checkboxInputs: QueryList<CheckboxInputComponent>;
  @ViewChildren(SelectInputComponent) selectInputs: QueryList<SelectInputComponent>;
  @ViewChildren(DateInputComponent) dateInputs: QueryList<DateInputComponent>;
  @ViewChildren(ExternalDataInputComponent) externalDataInputs: QueryList<ExternalDataInputComponent>;
  @ViewChildren(FileUploadComponent) fileUploads: QueryList<FileUploadComponent>;

  constructor(
    private route: ActivatedRoute,
    private logger: NGXLogger,
    private fieldFluxService: FieldFluxService,
    private documentService: DocumentService,
    private router: Router,
    private fluxService: FluxService,
  ) {


    effect(() => {
      this.acteName = this.fluxSelected().nom;
    });

    this.route.data.subscribe(data => {
      this.fluxDetail = data['docDetail'].flux;
      this.documentInfo = data['docDetail'].document;
      const flowId = data['docDetail'].document.info.type;
      this.documentId = this.documentInfo['info'].id_d;

      if (this.fluxDetail) {
        this.fields = this.fieldFluxService.extractFields(this.fluxDetail);
        // @TODO check type_piece existe
        this.filteredFields =
          this.fieldFluxService.filterFields(this.fields, flowId)
            .filter(field => field.idField !== 'type_piece');

        this.file_type_field = this.fields.find(field => field.idField === 'type_piece');
        this.populateFormFields(this.documentInfo['data']);
      } else {
        this.logger.error('Flux detail not found for the given acte');
      }
    });
  }

  onNextStepClick(): void {
    if (this.validateForm()) {
      this.globalErrorMessage = '';
      this.isLoading = true;
      this.save();
    } else {
      this.globalErrorMessage = 'Veuillez remplir tous les champs requis correctement.';
    }
  }

  save(): void {
    this.pieces.set([]);
    const docInfo = this.collectFormData();
    const docUpdateInfo = {
      entite_id: this.userCurrent().user_info.id_e,
      doc_info: docInfo
    };

    // Création d'un observable pour la mise à jour du document
    const updateDocument$ = this.documentService.updateDocument(this.documentId, docUpdateInfo).pipe(
      catchError(error => {
        this.logger.error('Error updating document', error);
        return of(null);
      })
    );

    updateDocument$.subscribe({
      next: (updateResult) => {
        if (updateResult && updateResult.content) {
          const updatedData = updateResult.content.data;

          // Gestion des fichiers
          const fileObservables = this.manageFiles(updatedData);

          // Utilisation de forkJoin 
          forkJoin([...fileObservables, updateDocument$]).subscribe({
            next: () => {
              this.fetchFileTypes();
            },
            error: (error) => {
              this.logger.error('Error in one of the file operations', error);
            }
          });
        }
      },
      error: (error) => {
        this.logger.error('Error updating document', error);
      }
    });
  }

  manageFiles(data: { [key: string]: any }): Observable<any>[] {
    const observables: Observable<any>[] = [];
    this.fileUploads.forEach(fileUpload => {
      const idField = fileUpload.getIdField();
      const currentFiles = fileUpload.formControl.value;
      const existingFiles = data[idField] || [];

      const filesToAdd = currentFiles.filter((file: File) => !existingFiles.includes(file.name));

      const filesToRemove = existingFiles.filter((fileName: string) => !currentFiles.some((file: File) => file.name === fileName));

      if (filesToAdd.length > 0) {
        const addFiles$ = this.documentService.uploadFiles(this.documentId, idField, this.userCurrent().user_info.id_e, filesToAdd).pipe(
          catchError(error => {
            this.logger.error('Error uploading files', error);
            return of(null);
          })
        );
        observables.push(addFiles$);
      }

      if (filesToRemove.length > 0) {
        const removeFiles$ = forkJoin(filesToRemove.map((fileName: string) =>
          this.documentService.deleteFileFromDocument(this.documentId, idField, this.userCurrent().user_info.id_e, fileName).pipe(
            catchError(error => {
              this.logger.error('Error deleting file', error);
              return of(null);
            })
          )
        ));
        observables.push(removeFiles$);
      }
    });

    return observables;
  }

  fetchFileTypes(): void {
    //TODO changer pour la sélection d'entite
    const entiteId = this.userCurrent().user_info.id_e;
    this.fluxService.get_externalData(entiteId, this.documentId, 'type_piece').subscribe({
      next: (response) => {
        this.fileTypes = response.actes_type_pj_list;
        this.pieces.set(response.pieces);
        this.selectedTypes = Array(this.pieces().length).fill('');
        this.currentStep = 2;
      },
      error: (error) => {
        this.logger.error('Error fetching file types and files', error);
      }
    });
  }

  uploadFiles(): Observable<any>[] {
    return this.fileUploads.map(fileUpload => {
      const files = fileUpload.formControl.value;
      const elementId = fileUpload.getIdField();

      if (files.length > 0) {
        return this.documentService.uploadFiles(this.documentId, elementId, this.userCurrent().user_info.id_e, files).pipe(
          catchError(error => {
            this.logger.error('Error uploading files', error);
            return of(null);
          })
        );
      } else {
        return of(null);
      }
    });
  }

  onAssignFileTypesClick(): void {
    this.isformSubmitted = true;
    if (this.isFormFileTypesValid()) {
      this.isSaving = true;
      this.assignFileTypes();
    } else {
      this.globalErrorMessage = 'Veuillez sélectionner tous les types de fichiers requis.';
      this.modalMessage = 'Veuillez sélectionner tous les types de fichiers requis.';
    }
  }

  isFormFileTypesValid(): boolean {
    return this.selectedTypes.every((type) => type !== '' && type !== undefined);
  }

  assignFileTypes(): void {
    const entiteId = this.userCurrent().user_info.id_e;
    this.documentService.assignFileTypes(entiteId, this.documentId, 'type_piece', this.selectedTypes).subscribe({
      next: (response) => {
        this.isSaving = false;
        this.isTypoSuccess = true;
        this.modalMessage = 'Le document a été créé et mis à jour avec succès.';
        this.scheduleRedirect();
        this.logger.info('File types assigned successfully', response);
      },
      error: (error) => {
        this.isTypoSuccess = false;
        this.logger.error('Error assigning file types', error);
        this.modalMessage = error.error.detail || 'Une erreur est survenue lors de la création ou de la mise à jour du document.';
      }
    });
  }

  onSelectChange(event: Event, index: number): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedTypes[index] = value;
  }
  onPreviousStepClick() {
    this.currentStep = 1;
    this.isLoading = false;
    this.loadDocumentData();
  }

  loadDocumentData(): void {
    this.documentService.getDocumentById(this.documentId, this.userCurrent().user_info.id_e).subscribe({
      next: (document) => {
        this.populateFormFields(document.data);
      },
      error: (error) => {
        this.logger.error('Error fetching document details', error);
      }
    });
  }

  collectFormData(): { [idField: string]: any } {
    const formData: { [idField: string]: any } = {};

    this.textInputs.forEach(comp => formData[comp.getIdField()] = comp.formControl.value);
    this.checkboxInputs.forEach(comp => formData[comp.getIdField()] = comp.formControl.value);
    this.selectInputs.forEach(comp => formData[comp.getIdField()] = comp.formControl.value);
    this.dateInputs.forEach(comp => formData[comp.getIdField()] = comp.formControl.value);
    this.externalDataInputs.forEach(comp => formData[comp.getIdField()] = comp.formControl.value);
    this.fileUploads.forEach(comp => formData[comp.getIdField()] = comp.formControl.value);

    return formData;
  }

  validateForm(): boolean {
    this.isFormValid = true;
    this.globalErrorMessage = '';

    const allInputs = [
      ...this.textInputs.toArray(),
      ...this.checkboxInputs.toArray(),
      ...this.selectInputs.toArray(),
      ...this.dateInputs.toArray(),
      ...this.externalDataInputs.toArray(),
      ...this.fileUploads.toArray()
    ];

    allInputs.forEach(comp => {
      if (comp instanceof SelectInputComponent && comp.formControl.disabled) {
        return;
      }

      if (comp instanceof ExternalDataInputComponent && comp.name === "Typologie des pièces") {
        return;
      }

      if (!comp.formControl.valid) {
        this.isFormValid = false;
        comp.formControl.markAsTouched();
      }
    });

    if (!this.isFormValid) {
      this.globalErrorMessage = 'Veuillez remplir tous les champs requis correctement.';
    }

    return this.isFormValid;
  }


  // Vérification pour chaque champ afin de voir s'il a une valeur dj définie 
  populateFormFields(data: { [key: string]: any }): void {
    this.textInputs.forEach(comp => {
      const idField = comp.getIdField();
      if (Object.prototype.hasOwnProperty.call(data, idField)) {
        const value = data[idField];
        if (this.hasValidValue(value)) {
          comp.formControl.setValue(value);
        }
      }
    });

    this.checkboxInputs.forEach(comp => {
      const idField = comp.getIdField();
      if (Object.prototype.hasOwnProperty.call(data, idField)) {
        const value = data[idField];
        if (this.hasValidValue(value)) {
          comp.formControl.setValue(value);
        }
      }
    });

    this.selectInputs.forEach(comp => {
      const idField = comp.getIdField();
      const optionKeys = Object.keys(comp.options)
      if (comp.required && optionKeys.length === 1) {
        comp.formControl.setValue(optionKeys);
      } else if (Object.prototype.hasOwnProperty.call(data, idField)) {
        const value = data[idField];
        if (this.hasValidValue(value)) {
          comp.formControl.setValue(value);
        }
      }
    });

    this.dateInputs.forEach(comp => {
      const idField = comp.getIdField();
      if (Object.prototype.hasOwnProperty.call(data, idField)) {
        const value = data[idField];
        if (this.hasValidValue(value)) {
          comp.formControl.setValue(value);
        }
      }
    });

    this.externalDataInputs.forEach(comp => {
      const idField = comp.getIdField();
      if (Object.prototype.hasOwnProperty.call(data, idField)) {
        const value = data[idField];
        if (this.hasValidValue(value)) {
          comp.formControl.setValue(value);
        }
      }
    });

    this.fileUploads.forEach(comp => {
      const idField = comp.getIdField();
      const existingFiles = data[idField];
      if (existingFiles && existingFiles.length) {
        const fileObservables = existingFiles.map((fileName: string) =>
          this.documentService.downloadFileByName(this.userCurrent().user_info.id_e, this.documentId, idField, fileName)
        );

        forkJoin(fileObservables).subscribe({
          next: (blobs: Blob[]) => {
            const files = blobs.map((blob: Blob, index: number) => new File([blob], existingFiles[index], { type: blob.type }));
            comp.setFiles(files);
          },
          error: (error) => {
            this.logger.error('Error downloading files', error);
          }
        });
      }
    });
  }

  // Helper method to check if a value is valid (not null, not empty string, not empty array)
  hasValidValue(value: any): boolean {
    if (value === null || value === undefined) {
      return false;
    }
    if (typeof value === 'string' && value.trim() === '') {
      return false;
    }
    if (Array.isArray(value) && value.length === 0) {
      return false;
    }
    return true;
  }

  isTypeSelected(index: number): boolean {
    return this.selectedTypes[index] !== '';
  }

  scheduleRedirect(): void {
    setTimeout(() => {
      this.router.navigate(['/documents', this.acteName]);
    }, 3000);
  }

  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }
}
