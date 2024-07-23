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
  formSubmitted = false;
  isTypoSuccess: boolean = null;
  isLoading = false;
  isSaving = false;
  modalMessage: string;


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
      const flowId = data['docDetail'].document.info.type;
      this.documentId = this.route.snapshot.paramMap.get('documentId');

      if (this.fluxDetail) {
        this.fields = this.fieldFluxService.extractFields(this.fluxDetail);
        this.filteredFields =
          this.fieldFluxService.filterFields(this.fields, flowId)
            .filter(field => field.idField !== 'type_piece');

        this.file_type_field = this.fields.find(field => field.idField === 'type_piece');
      } else {
        this.logger.error('Flux detail not found for the given acte');
      }
    });
  }

  onNextStepClick(): void {
    if (this.validateForm()) {
      this.globalErrorMessage = '';
      this.isLoading = true;
      this.openModal();
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

    const updateDocument$ = this.documentService.updateDocument(this.documentId, docUpdateInfo).pipe(
      catchError(error => {
        this.logger.error('Error updating document', error);
        return of(null);
      })
    );

    const fileUploadObservables = this.uploadFiles().filter(obs => obs !== null);

    forkJoin([...fileUploadObservables, updateDocument$]).subscribe({
      next: () => {
        this.fetchFileTypes();
      },
      error: (error) => {
        this.logger.error('Error in one of the file uploads', error);
      }
    });
  }

  fetchFileTypes(): void {
    const entiteId = this.userCurrent().user_info.id_e;
    this.fluxService.get_externalData(entiteId, this.documentId, 'type_piece').subscribe({
      next: (response) => {
        this.fileTypes = response.actes_type_pj_list;
        this.pieces.set(response.pieces);
        console.log("this.pieces.length" + this.pieces().length)
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
    this.formSubmitted = true;
    if (this.isFormFileTypesValid()) {
      this.isSaving = true;
      this.assignFileTypes();
    } else {
      this.globalErrorMessage = 'Veuillez sélectionner tous les types de fichiers requis.';
    }
  }

  isFormFileTypesValid(): boolean {
    return this.selectedTypes.every((type) => type !== '');
  }

  assignFileTypes(): void {
    const entiteId = this.userCurrent().user_info.id_e;
    this.documentService.assignFileTypes(entiteId, this.documentId, 'type_piece', this.selectedTypes).subscribe({
      next: (response) => {
        this.isSaving = false;
        this.isTypoSuccess = true;
        this.modalMessage = 'Le document a été créé et mis à jour avec succès.';
        this.openModal();
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


  isTypeSelected(index: number): boolean {
    return this.selectedTypes[index] !== '' && this.selectedTypes[index] !== undefined;
  }

  scheduleRedirect(): void {
    setTimeout(() => {
      this.router.navigate(['/documents', this.acteName]);
    }, 3000);
  }

  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  openModal(): void {
    const modal = document.getElementById('fr-modal') as HTMLDialogElement;
    if (modal) {
      if (modal.open) {
        modal.close();
      }
      modal.showModal();
    }
  }

  closeModal(): void {
    const modal = document.getElementById('fr-modal') as HTMLDialogElement;
    if (modal && modal.open) {
      modal.close();
    }
  }
}
