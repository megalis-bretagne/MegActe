import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { NGXLogger } from "ngx-logger";
import { Observable, catchError, of } from "rxjs";
import { SettingsService } from "src/environments/settings.service";



@Injectable({
    providedIn: 'root'
})
export class FileUploadService {

    constructor(
        private http: HttpClient,
        private logger: NGXLogger,
        private settingsService: SettingsService
    ) { }

    uploadFiles(documentId: string, elementId: string, entiteId: number, files: File[]): Observable<any> {
        const formData: FormData = new FormData();
        files.forEach(file => {
            formData.append('files', file, file.name);
        });

        return this.http.post<any>(`${this.settingsService.apiUrl}/document/${documentId}/file/${elementId}?entite_id=${entiteId}`, formData).pipe(
            catchError((error) => {
                this.logger.error('Error uploading files', error);
                return of(null);
            })
        );
    }
}

