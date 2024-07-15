import { Component, OnInit, QueryList, ViewChildren } from '@angular/core';
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

@Component({
  selector: 'app-acte-form',
  templateUrl: './acte-form.component.html',
  styleUrls: ['./acte-form.component.scss']
})
export class ActeFormComponent implements OnInit {
  acteName: string;
  fluxDetail: Data;
  fields: Field[] = [];
  filteredFields: Field[] = [];
  documentId: string;
  isSuccess: boolean;
  modalMessage: string;
  globalErrorMessage: string;
  isSaving: boolean = false;

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
  ) { }


  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.fluxDetail = data['fluxDetail'];
      this.documentId = this.route.snapshot.paramMap.get('documentId');
      this.acteName = this.sharedDataService.getActeID();

      if (this.fluxDetail) {
        this.fields = this.fieldFluxService.extractFields(this.fluxDetail);
        this.filteredFields = this.fieldFluxService.filterFields(this.fields, this.sharedDataService.getFieldByName(this.acteName));
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
          this.logger.info('Document updated successfully', updateResponse);
          this.logger.info('All files uploaded successfully', uploadResponses);
          this.isSuccess = true;
          this.modalMessage = 'Le document a été créé et mis à jour avec succès.';
          this.openModal();
        } else {
          this.isSuccess = false;
          this.modalMessage = 'Une erreur est survenue lors de la mise à jour du document.';
          this.openModal();
        }
      },
      error: (error) => {
        this.logger.error('Error in one of the file uploads', error);
        this.isSuccess = false;
        this.modalMessage = 'Une erreur est survenue lors du téléchargement des fichiers.';
        this.openModal();
      }
    });
  }

  uploadFiles(): Observable<any>[] {
    return this.fileUploads.map(fileUpload => {
      const files = fileUpload.fileControl.value;
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

  collectFormData(): { [idField: string]: any } {
    const formData: { [idField: string]: any } = {};

    this.textInputs.forEach(comp => formData[comp.getIdField()] = comp.inputControl.value);
    this.checkboxInputs.forEach(comp => formData[comp.getIdField()] = comp.checkboxControl.value);
    this.selectInputs.forEach(comp => formData[comp.getIdField()] = comp.selectControl.value);
    this.dateInputs.forEach(comp => formData[comp.getIdField()] = comp.dateControl.value);
    this.externalDataInputs.forEach(comp => formData[comp.getIdField()] = comp.externalDataControl.value);
    this.fileUploads.forEach(comp => formData[comp.getIdField()] = comp.fileControl.value);

    return formData;
  }

  deleteDocument(): void {
    const entiteId = this.sharedDataService.getUser().user_info.id_e;
    this.documentService.deleteDocument(this.documentId, entiteId).subscribe({
      next: (response) => this.logger.info('Document deleted successfully', response),
      error: (error) => this.logger.error('Error deleting document', error)
    });
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
    this.scheduleRedirect();
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

  validateForm(): boolean {
    let isValid = true;
    this.globalErrorMessage = '';

    const typeToFieldArray: { [key: string]: any[] } = {
      'text': this.textInputs.toArray(),
      'checkbox': this.checkboxInputs.toArray(),
      'select': this.selectInputs.toArray(),
      'date': this.dateInputs.toArray(),
      'externalData': this.externalDataInputs.toArray().filter(comp => comp.name !== "Typologie des pièces"),
      'file': this.fileUploads.toArray()
    };

    const controlMapping: { [key: string]: string } = {
      'text': 'inputControl',
      'checkbox': 'checkboxControl',
      'select': 'selectControl',
      'date': 'dateControl',
      'externalData': 'externalDataControl',
      'file': 'fileControl'
    };

    for (const [type, components] of Object.entries(typeToFieldArray)) {
      components.forEach(comp => {
        const control = comp[controlMapping[type]];
        if (control) {
          if (!control.valid) {
            isValid = false;
            control.markAsTouched();
          }
        }
      });
    }

    if (!isValid) {
      this.globalErrorMessage = 'Veuillez remplir tous les champs requis correctement.';
    }

    return isValid;
  }
}


