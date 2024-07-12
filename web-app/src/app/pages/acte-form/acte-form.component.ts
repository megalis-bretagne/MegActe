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
import { FileUploadService } from 'src/app/services/fileUploadServices/file-upload.service';
import { SharedDataService } from 'src/app/services/sharedData.service';

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
    private fileUploadService: FileUploadService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.fluxDetail = data['fluxDetail'];
      this.acteName = this.route.snapshot.paramMap.get('nom');
      this.documentId = this.route.snapshot.paramMap.get('documentId');
      if (this.fluxDetail) {
        this.fields = this.fieldFluxService.extractFields(this.fluxDetail);
        this.filteredFields = this.fieldFluxService.filterFields(this.fields);
      } else {
        this.logger.error('Flux detail not found for the given acte');
      }
    });
  }

  enregistrer(): void {
    if (!this.validateForm()) {
      this.isSuccess = false;
      this.modalMessage = 'Veuillez remplir tous les champs requis correctement.';
      return;
    }

    const docInfo = this.collectFormData();
    const docUpdateInfo = {
      entite_id: this.sharedDataService.getUser().user_info.id_e,
      doc_info: docInfo
    };

    this.documentService.updateDocument(this.documentId, docUpdateInfo).subscribe({
      next: (response) => {
        this.logger.info('Document updated successfully', response);
        this.uploadFiles();
        this.isSuccess = true;
        this.modalMessage = 'Le document a été créé et mis à jour avec succès.';
        this.openModalAndRedirect();
      },
      error: (error) => {
        this.logger.error('Error updating document', error);
        this.isSuccess = false;
        this.modalMessage = error.error.detail || 'Une erreur est survenue lors de la création ou de la mise à jour du document.';
        this.deleteDocument();
        this.openModalAndRedirect();
      }
    });
  }

  transmettre(): void {

  }

  collectFormData(): { [key: string]: any } {
    const formData: { [key: string]: any } = {};

    this.textInputs.forEach(comp => formData[comp.getKey()] = comp.inputControl.value);
    this.checkboxInputs.forEach(comp => formData[comp.getKey()] = comp.checkboxControl.value);
    this.selectInputs.forEach(comp => formData[comp.getKey()] = comp.selectControl.value);
    this.dateInputs.forEach(comp => formData[comp.getKey()] = comp.dateControl.value);
    this.externalDataInputs.forEach(comp => formData[comp.getKey()] = comp.externalDataControl.value);
    this.fileUploads.forEach(comp => formData[comp.getKey()] = comp.fileControl.value);

    return formData;
  }

  uploadFiles(): void {
    this.fileUploads.forEach(fileUpload => {
      const files = fileUpload.fileControl.value;
      const elementId = fileUpload.getKey();

      if (files.length > 0) {
        this.fileUploadService.uploadFiles(this.documentId, elementId, this.sharedDataService.getUser().user_info.id_e, files).subscribe({
          next: (response) => this.logger.info('Files uploaded successfully', response),
          error: (error) => this.logger.error('Error uploading files', error)
        });
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

  openModalAndRedirect(): void {
    const modal = document.getElementById('fr-modal') as HTMLDialogElement;
    if (modal) {
      if (modal.open) {
        modal.close();
      }
      modal.showModal();
    }
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

    this.textInputs.forEach(comp => {
      if (!comp.inputControl.valid) {
        isValid = false;
        comp.inputControl.markAsTouched();
      }
    });

    this.checkboxInputs.forEach(comp => {
      if (!comp.checkboxControl.valid) {
        isValid = false;
        comp.checkboxControl.markAsTouched();
      }
    });

    this.selectInputs.forEach(comp => {
      if (!comp.selectControl.disabled && !comp.selectControl.valid) {
        isValid = false;
        comp.selectControl.markAsTouched();
      }
    });

    this.dateInputs.forEach(comp => {
      if (!comp.dateControl.valid) {
        isValid = false;
        comp.dateControl.markAsTouched();
      }
    });

    /* 
    * TO DO :
    * Récuperer les valeurs de Typologie des pièces
    */
    this.externalDataInputs.forEach(comp => {
      // Exclude the input with the name "Typologie des pièces"
      if (comp.name !== "Typologie des pièces" && !comp.externalDataControl.valid) {
        isValid = false;
        comp.externalDataControl.markAsTouched();
      }
    });

    this.fileUploads.forEach(comp => {
      if (!comp.fileControl.valid) {
        isValid = false;
        comp.fileControl.markAsTouched();
        console.log("Invalid file input: ", comp.getKey());
      }
    });

    if (!isValid) {
      this.globalErrorMessage = 'Veuillez remplir tous les champs requis correctement.';
    }

    return isValid;
  }

}
