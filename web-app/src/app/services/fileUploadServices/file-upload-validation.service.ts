import { Injectable } from '@angular/core';
import { SettingsService } from 'src/environments/settings.service';

@Injectable({
    providedIn: 'root'
})
export class FileUploadValidationService {

    constructor(private settingsService: SettingsService) { }

    validateFiles(files: FileList, existingFiles: File[], multiple: boolean): string | null {
        if (!multiple) {
            return this.validateSingleFile(files, existingFiles);
        } else {
            return this.validateMultipleFiles(files, existingFiles);
        }
    }

    private validateSingleFile(files: FileList, existingFiles: File[]): string | null {
        if (existingFiles.length > 0) {
            return "Un fichier est déjà déposé.";
        }

        if (files.length > 1) {
            return "Vous ne pouvez déposer qu'un seul fichier.";
        }

        const file = files[0];
        if (!this.isFileTypeAllowed(file)) {
            return `Seuls les fichiers ${this.getAllowedFileType()} sont autorisés.`;
        }

        if (!this.isFileSizeAllowed(file.size)) {
            return `La taille du fichier ne doit pas dépasser ${this.getMaxSingleFileSizeMo()} Mo`;
        }

        return null;
    }

    private validateMultipleFiles(files: FileList, existingFiles: File[]): string | null {
        if (!Array.from(files).every(file => this.isFileTypeAllowed(file))) {
            return `Seuls les fichiers ${this.getAllowedFileType()} sont autorisés.`;
        }

        if (Array.from(files).some(file => this.isDuplicateFile(file, existingFiles))) {
            return "Vous ne pouvez pas télécharger le même fichier plusieurs fois.";
        }

        const totalSize = existingFiles.reduce((acc, file) => acc + file.size, 0) + Array.from(files).reduce((acc, file) => acc + file.size, 0);
        if (totalSize > this.settingsService.getSetting().fileUpload.maxTotalFileSize) {
            return `La taille totale des fichiers ne doit pas dépasser ${this.getMaxTotalFileSizeMo()} Mo.`;
        }

        return null;
    }

    private isFileTypeAllowed(file: File): boolean {
        return file.type === this.settingsService.getSetting().fileUpload.allowedFileType;
    }

    private isFileSizeAllowed(size: number): boolean {
        return size <= this.settingsService.getSetting().fileUpload.maxSingleFileSize;
    }

    private isDuplicateFile(file: File, existingFiles: File[]): boolean {
        return existingFiles.some(existingFile =>
            existingFile.name === file.name &&
            existingFile.size === file.size &&
            existingFile.lastModified === file.lastModified
        );
    }

    //Récupèrer la taille maximale d'un fichier unique en Mo
    private getMaxSingleFileSizeMo(): number {
        return this.settingsService.getSetting().fileUpload.maxSingleFileSize / (1024 * 1024);
    }

    //Récupèrer la taille totale maximale des fichiers en Mo
    private getMaxTotalFileSizeMo(): number {
        return this.settingsService.getSetting().fileUpload.maxTotalFileSize / (1024 * 1024);
    }
    //Récupèrer le type de fichier autorisé
    private getAllowedFileType(): string {
        return this.settingsService.getSetting().fileUpload.allowedFileType.split('/')[1];
    }
}
