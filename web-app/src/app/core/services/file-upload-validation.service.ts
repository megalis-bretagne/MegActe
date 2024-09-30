import { inject, Injectable } from '@angular/core';
import { SettingsService } from 'src/environments/settings.service';

@Injectable({
    providedIn: 'root'
})
export class FileUploadValidationService {

    private _settingsService = inject(SettingsService);

    validateFiles(files: FileList, existingFiles: File[], multiple: boolean): string | null {
        if (!multiple) {
            return this._validateSingleFile(files, existingFiles);
        } else {
            return this._validateMultipleFiles(files, existingFiles);
        }
    }

    private _validateSingleFile(files: FileList, existingFiles: File[]): string | null {
        if (existingFiles.length > 0) {
            return "Un fichier est déjà déposé.";
        }

        if (files.length > 1) {
            return "Vous ne pouvez déposer qu'un seul fichier.";
        }

        const file = files[0];
        if (!this._isFileTypeAllowed(file)) {
            return `Seuls les fichiers ${this._getAllowedFileType()} sont autorisés.`;
        }

        if (!this._isFileSizeAllowed(file.size)) {
            return `La taille du fichier ne doit pas dépasser ${this._getMaxSingleFileSizeMo()} Mo`;
        }

        return null;
    }

    private _validateMultipleFiles(files: FileList, existingFiles: File[]): string | null {
        if (!Array.from(files).every(file => this._isFileTypeAllowed(file))) {
            return `Seuls les fichiers ${this._getAllowedFileType()} sont autorisés.`;
        }

        if (Array.from(files).some(file => this._isDuplicateFile(file, existingFiles))) {
            return "Vous ne pouvez pas télécharger le même fichier plusieurs fois.";
        }

        const totalSize = existingFiles.reduce((acc, file) => acc + file.size, 0) + Array.from(files).reduce((acc, file) => acc + file.size, 0);
        if (totalSize > this._settingsService.getSetting().fileUpload.maxTotalFileSize) {
            return `La taille totale des fichiers ne doit pas dépasser ${this._getMaxTotalFileSizeMo()} Mo.`;
        }

        return null;
    }

    private _isFileTypeAllowed(file: File): boolean {
        return file.type === this._settingsService.getSetting().fileUpload.allowedFileType;
    }

    private _isFileSizeAllowed(size: number): boolean {
        return size <= this._settingsService.getSetting().fileUpload.maxSingleFileSize;
    }

    private _isDuplicateFile(file: File, existingFiles: File[]): boolean {
        return existingFiles.some(existingFile =>
            existingFile.name === file.name &&
            existingFile.size === file.size &&
            existingFile.lastModified === file.lastModified
        );
    }

    //Récupèrer la taille maximale d'un fichier unique en Mo
    private _getMaxSingleFileSizeMo(): number {
        return this._settingsService.getSetting().fileUpload.maxSingleFileSize / (1024 * 1024);
    }

    //Récupèrer la taille totale maximale des fichiers en Mo
    private _getMaxTotalFileSizeMo(): number {
        return this._settingsService.getSetting().fileUpload.maxTotalFileSize / (1024 * 1024);
    }
    //Récupèrer le type de fichier autorisé
    private _getAllowedFileType(): string {
        return this._settingsService.getSetting().fileUpload.allowedFileType.split('/')[1];
    }
}
