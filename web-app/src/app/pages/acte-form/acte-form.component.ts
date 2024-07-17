import { Component, effect, inject, OnInit, QueryList, ViewChildren, signal } from '@angular/core';
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
import { SharedDataService } from 'src/app/services/sharedData.service';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LoadingTemplateComponent } from 'src/app/components/loading-template/loading-template.component';
import { FluxService } from 'src/app/services/flux.service';

@Component({
  selector: 'app-acte-form',
  standalone: true,
  imports: [
    LoadingTemplateComponent, ExternalDataInputComponent, FileUploadComponent,
    DateInputComponent, SelectInputComponent, CheckboxInputComponent, TextInputComponent
  ],
  templateUrl: './acte-form.component.html',
  styleUrls: ['./acte-form.component.scss']
})
export class ActeFormComponent implements OnInit {
  fluxSelected = inject(FluxService).fluxSelected;
  acteName: string;
  fluxDetail: Data;
  fields: Field[] = [];
  filteredFields: Field[] = [];
  documentId: string;
  modalMessage: string;
  globalErrorMessage: string;
  isSaving: boolean = false;
  isCreationSuccess: boolean = false;
  isValid: boolean = true;
  isSuccess: boolean;
  isSend: boolean = false;
  fileTypes: { [key: string]: string } = {};
  pieces = signal<string[]>([])
  selectedTypes: string[] = [];
  file_type_field: Field;
  fetchedFileType: boolean = false;


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
    private sharedDataService: SharedDataService,
    private documentService: DocumentService,
    private router: Router,
    private fluxService: FluxService,
  ) {
    effect(() => {
      this.acteName = this.fluxSelected().nom;
    })
  }


  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.fluxDetail = data['docDetail'].flux;
      // TODO récupérer les info du document dans data['docDetail'].document
      this.documentId = this.route.snapshot.paramMap.get('documentId');

      if (this.fluxDetail) {
        this.fields = this.fieldFluxService.extractFields(this.fluxDetail);
        this.filteredFields = this.fieldFluxService.filterFields(this.fields, this.sharedDataService.getFieldByName(this.acteName));

        this.file_type_field = this.fields.find(field => field.idField === 'type_piece');
        console.log(" this.file_type_field" + JSON.stringify({ data: this.file_type_field }, null, 4));
      } else {
        this.logger.error('Flux detail not found for the given acte');
      }
    });
  }

  save(): void {
    if (!this.validateForm()) {
      this.isSuccess = false;
      this.modalMessage = 'Veuillez remplir tous les champs requis correctement.';
      return;
    }

    this.isSaving = true;
    const docInfo = this.collectFormData();
    const docUpdateInfo = {
      entite_id: this.sharedDataService.getUser().user_info.id_e,
      doc_info: docInfo
    };

    // Création d'un observable pour la mise à jour du document
    const updateDocument$ = this.documentService.updateDocument(this.documentId, docUpdateInfo).pipe(
      catchError(error => {
        this.logger.error('Error updating document', error);
        this.isSuccess = false;
        this.isSaving = false;
        this.modalMessage = error.error.detail || 'Une erreur est survenue lors de la création ou de la mise à jour du document.';
        this.deleteDocument();
        return of(null);
      })
    );

    // Téléchargement de fichiers
    const fileUploadObservables = this.uploadFiles().filter(obs => obs !== null);

    // Utilisation de forkJoin 
    forkJoin([...fileUploadObservables, updateDocument$]).subscribe({
      next: (responses) => {
        const updateResponse = responses[0];
        const uploadResponses = responses.slice(1);

        if (updateResponse) {
          this.logger.info('Document and all files are updated successfully', updateResponse, uploadResponses);
          // this.isSuccess = true;
          this.isCreationSuccess = true;
          this.isSaving = false;
          // this.modalMessage = 'Le document a été créé et mis à jour avec succès.';
          this.fetchFileTypes();
        } else {
          this.isSuccess = false;
          this.isSaving = false;
          this.modalMessage = 'Une erreur est survenue lors de la mise à jour du document.';
          this.openModal();
        }
      },
      error: (error) => {
        this.logger.error('Error in one of the file uploads', error);
        this.isSuccess = false;
        this.isSaving = false;
        this.modalMessage = 'Une erreur est survenue lors du téléchargement des fichiers.';
        this.openModal();
      }
    });
  }

  uploadFiles(): Observable<any>[] {
    return this.fileUploads.map(fileUpload => {
      const files = fileUpload.formControl.value;
      const elementId = fileUpload.getIdField();

      if (files.length > 0) {
        return this.documentService.uploadFiles(this.documentId, elementId, this.sharedDataService.getUser().user_info.id_e, files).pipe(
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

  deleteDocument(): void {
    const entiteId = this.sharedDataService.getUser().user_info.id_e;
    this.documentService.deleteDocument(this.documentId, entiteId).subscribe({
      next: (response) => this.logger.info('Document deleted successfully', response),
      error: (error) => this.logger.error('Error deleting document', error)
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
    this.isValid = true;
    this.globalErrorMessage = '';

    // Créer une collection unique de tous les composants de formulaire
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
        return; // Skip validation for this specific component
      }

      if (comp instanceof ExternalDataInputComponent && comp.name === "Typologie des pièces") {
        return; // Skip validation for this specific component
      }

      if (!comp.formControl.valid) {
        this.isValid = false;
        comp.formControl.markAsTouched();
      }
    });

    if (!this.isValid) {
      this.globalErrorMessage = 'Veuillez remplir tous les champs requis correctement.';
    }

    return this.isValid;
  }

  fetchFileTypes(): void {
    const entiteId = this.sharedDataService.getUser().user_info.id_e;
    this.fluxService.get_externalData(entiteId, this.documentId, 'type_piece').subscribe({
      next: (response) => {
        this.fileTypes = response.actes_type_pj_list;
        this.pieces.set(response.pieces)
        this.selectedTypes = Array(this.pieces.length).fill('');
        this.fetchedFileType = true;
        // this.openModal();
      },
      error: (error) => {
        this.logger.error('Error fetching file types and files', error);
        this.isSuccess = false;
        this.modalMessage = 'Une erreur est survenue lors de la récupération des types de fichiers.';
        this.openModal();
      }
    });
  }

  assignFileTypes(): void {
    const entiteId = this.sharedDataService.getUser().user_info.id_e;
    console.log("this.selectedTypes-------" + this.selectedTypes);
    this.documentService.assignFileTypes(entiteId, this.documentId, 'type_piece', this.selectedTypes).subscribe({
      next: (response) => {
        this.logger.info('File types assigned successfully', response);
        this.isSuccess = true;
        this.isSend = true;
        this.modalMessage = 'Le document a été créé et mis à jour avec succès.';
        this.openModal();
        this.scheduleRedirect()
      },
      error: (error) => {
        this.logger.error('Error assigning file types', error);
        this.isSuccess = false;
        this.isSend = false;
        this.modalMessage = 'Une erreur est survenue lors de la création ou de la mise à jour du document.';
        this.openModal();
        this.scheduleRedirect()
      }
    });
  }

  isFormFileTypesValid(): boolean {
    return this.selectedTypes.every(type => type !== '');
  }
  isTypeSelected(index: number): boolean {
    return this.selectedTypes[index] !== '';
  }


  openModal(): void {
    const modal = document.getElementById('fr-modal') as HTMLDialogElement;
    if (modal) {
      if (modal.open) {
        modal.close();
      }
      modal.showModal();
    }
    this.isSaving = false;
  }
  closeModal(): void {
    const modal = document.getElementById('fr-modal') as HTMLDialogElement;
    if (modal && modal.open) {
      modal.close();
    }
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