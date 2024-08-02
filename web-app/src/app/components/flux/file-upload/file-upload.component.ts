import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { FieldFluxService } from 'src/app/services/field-flux.service';
import { FileUploadValidationService } from 'src/app/services/file-upload-validation.service';
import { BaseInputComponent } from '../BaseInput.component';
import { CommonModule } from '@angular/common';
import { DragAndDropDirective } from 'src/app/shared/directives/drag-and-drop.directive';

@Component({
  selector: 'meg-file-upload',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, DragAndDropDirective],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent extends BaseInputComponent {
  @Input() multiple: boolean = false;

  @ViewChild('fileInput', { static: false }) fileInput: ElementRef | undefined;

  files: File[] = [];
  errorMessage: string = '';

  constructor(private validationService: FileUploadValidationService, protected override fieldFluxService: FieldFluxService) {
    super(fieldFluxService);
  }

  override getControlType(): string {
    return 'file';
  }

  override getDefaultValue(): any {
    return [];
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
      this.addFiles(Array.from(files));
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

  addFiles(files: File[]): void {
    if (this.multiple) {
      this.files.push(...files);
    } else {
      this.files = files;
    }
    this.formControl.setValue(this.files);
    this.formControl.updateValueAndValidity();
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

  setFiles(files: File[]): void {
    this.files = files;
    this.formControl.setValue(files);
    this.formControl.updateValueAndValidity();
  }
}
