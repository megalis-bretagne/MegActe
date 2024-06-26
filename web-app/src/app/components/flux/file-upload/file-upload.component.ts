import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { FileUploadValidationService } from 'src/app/services/fileUploadServices/file-upload-validation.service';

@Component({
  selector: 'meg-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent {
  @Input() name: string = '';
  @Input() required: boolean = false;
  @Input() multiple: boolean = false;
  @Input() commentaire: string = '';

  @ViewChild('fileInput', { static: false }) fileInput: ElementRef | undefined;

  files: File[] = [];
  errorMessage: string = '';

  constructor(private validationService: FileUploadValidationService) { }

  onFilesDropped(files: FileList): void {
    const error = this.validationService.validateFiles(files, this.files, this.multiple);
    if (error) {
      this.errorMessage = error;
    } else {
      if (this.multiple) {
        this.files.push(...Array.from(files));
      } else {
        this.files = Array.from(files);
      }
      this.errorMessage = '';
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
    this.errorMessage = '';
    this.resetFileInput();
  }

  private resetFileInput(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }
}
