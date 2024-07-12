import { Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { FieldFluxService } from 'src/app/services/field-flux.service';
import { FileUploadValidationService } from 'src/app/services/file-upload-validation.service';

@Component({
  selector: 'meg-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent implements OnInit {
  @Input() idField: string = '';
  @Input() name: string = '';
  @Input() required: boolean = false;
  @Input() multiple: boolean = false;
  @Input() commentaire: string = '';

  @ViewChild('fileInput', { static: false }) fileInput: ElementRef | undefined;

  fileControl: FormControl;
  files: File[] = [];
  errorMessage: string = '';
  fileInputId: string;


  constructor(private validationService: FileUploadValidationService, private fieldFluxService: FieldFluxService) { }

  ngOnInit() {
    const validators = this.required ? [Validators.required] : [];
    this.fileControl = new FormControl('', validators);
    this.fileInputId = this.fieldFluxService.generateUniqueId('file');
  }

  onFilesDropped(files: FileList): void {
    const error = this.validationService.validateFiles(files, this.files, this.multiple);
    if (error) {
      this.errorMessage = error;
      this.fileControl.setErrors({ incorrect: true });
      this.fileControl.markAsTouched();
    } else {
      if (this.multiple) {
        this.files.push(...Array.from(files));
      } else {
        this.files = Array.from(files);
      }
      this.errorMessage = '';
      this.fileControl.setValue(this.files);
      this.fileControl.updateValueAndValidity();
      this.resetFileInput();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.onFilesDropped(input.files);
    }
    this.resetFileInput();
  }

  removeFile(file: File): void {
    this.files = this.files.filter(f => f !== file);
    if (this.files.length === 0 && this.required) {
      this.fileControl.setErrors({ required: true });
      this.fileControl.markAsTouched();
      this.errorMessage = 'Ce champ est requis.';
    } else {
      this.errorMessage = '';
      this.fileControl.setValue(this.files);
      this.fileControl.updateValueAndValidity();
    }
  }

  private resetFileInput(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  getIdField(): string {
    return this.idField;
  }
}
