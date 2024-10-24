import { Component, Input, ViewChild, ElementRef, input, signal, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { FieldFluxService } from 'src/app/core/services/field-flux.service';
import { FileUploadValidationService } from 'src/app/core/services/file-upload-validation.service';
import { BaseInputComponent } from '../BaseInput.component';
import { CommonModule } from '@angular/common';
import { DragAndDropDirective } from 'src/app/shared/directives/drag-and-drop.directive';
import { HttpDocumentService } from 'src/app/core/services/http/http-document.service';
import { LoadingComponent } from '../../loading-component/loading.component';

export enum FileActionState {
  Add = 'ADD',
  Delete = 'DELETE'
}

@Component({
  selector: 'meg-file-upload',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, LoadingComponent, DragAndDropDirective],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent extends BaseInputComponent {
  private readonly _documentService = inject(HttpDocumentService);

  @Input() multiple: boolean = false;
  id_d = input.required<string>();
  id_e = input.required<number>();

  actionState = FileActionState;
  action_one_file = signal<FileActionState | null>(null);

  @ViewChild('fileInput', { static: false }) fileInput: ElementRef | undefined;

  files: File[] = [];
  errorMessage: string = '';

  constructor(private readonly _validationService: FileUploadValidationService, protected override fieldFluxService: FieldFluxService) {
    super(fieldFluxService);
  }

  override initInput(): void {
    this.formControl.setValidators(this.getValidators());
    this._setFiles();
  }

  override getControlType(): string {
    return 'file';
  }

  override getDefaultValue(): [] {
    return [];
  }

  override getValidators(): ValidatorFn[] {
    return this.required ? [Validators.required] : [];
  }

  onFilesDropped(files: FileList): void {
    const error = this._validationService.validateFiles(files, this.files, this.multiple);
    if (error) {
      this.errorMessage = error;
      this.formControl.setErrors({ incorrect: true });
      this.formControl.markAsTouched();
    } else {
      this._uploadFile(Array.from(files));
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.onFilesDropped(input.files);
    }
  }

  removeFile(file: File): void {
    this.action_one_file.set(FileActionState.Delete)

    this._documentService.deleteFileFromDocument(this.id_d(), this.idField, this.id_e(), file.name).subscribe(
      {
        next: () => {
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
          this.action_one_file.set(null);
        },
      }
    )

  }

  private _uploadFile(files: File[]): void {
    this.action_one_file.set(FileActionState.Add);
    this._documentService.uploadFiles(this.id_d(), this.idField, this.id_e(), files).subscribe(
      {
        next: () => {
          if (this.multiple) {
            this.files.push(...files);
          } else {
            this.files = files;
          }
          this.formControl.setValue(this.files);
          this.formControl.updateValueAndValidity();
          this._resetFileInput();
        },
        complete: () => this.action_one_file.set(null)
      }
    );
  }

  private _resetFileInput(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private _setFiles(): void {
    const value = this.formControl.value;
    if (Array.isArray(value) && value.length > 0) {
      value.forEach(docName => {
        this.files.push(new File([], docName))
      })
    }
  }
}
