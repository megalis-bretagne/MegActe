import { Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ValidatorFn, Validators } from '@angular/forms';
import { FieldFluxService } from 'src/app/services/field-flux.service';
import { FileUploadValidationService } from 'src/app/services/file-upload-validation.service';
import { BaseInputComponent } from '../BaseInput.component';

@Component({
  selector: 'meg-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent extends BaseInputComponent implements OnInit {
  @Input() multiple: boolean = false;

  @ViewChild('fileInput', { static: false }) fileInput: ElementRef | undefined;

  files: File[] = [];
  errorMessage: string = '';


  constructor(private validationService: FileUploadValidationService, protected override fieldFluxService: FieldFluxService) {
    super(fieldFluxService);
  }

  override ngOnInit() {
    super.ngOnInit();
  }

  override getControlType(): string {
    return 'file';
  }

  override getDefaultValue(): any {
    return '';
  }

  override getValidators(): ValidatorFn[] {
    return this.required ? [Validators.required] : [];
  }

  onFilesDropped(files: FileList): void {
    const error = this.validationService.validateFiles(files, this.files, this.multiple);
    if (error) {
      this.errorMessage = error;
      this.formControl.setErrors({ incorrect: true });
      this.formControl.markAsTouched();
    } else {
      if (this.multiple) {
        this.files.push(...Array.from(files));
      } else {
        this.files = Array.from(files);
      }
      this.errorMessage = '';
      this.formControl.setValue(this.files);
      this.formControl.updateValueAndValidity();
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
      this.formControl.setErrors({ required: true });
      this.formControl.markAsTouched();
      this.errorMessage = 'Ce champ est requis.';
    } else {
      this.errorMessage = '';
      this.formControl.setValue(this.files);
      this.formControl.updateValueAndValidity();
    }
  }

  private resetFileInput(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

}
