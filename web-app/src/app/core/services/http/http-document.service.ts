import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { DocCreateInfo, DocumentDetail, DocumentInfo, DocumentPaginate, DocUpdateInfo } from "../../model/document.model";
import { Observable, catchError, of, tap, throwError } from "rxjs";
import { NGXLogger } from "ngx-logger";
import { SettingsService } from "src/environments/settings.service";

@Injectable({
    providedIn: 'root'
})
export class HttpDocumentService {
    private _http = inject(HttpClient);
    private _logger = inject(NGXLogger);
    private _settingsService = inject(SettingsService);



    createDocument(docCreateInfo: DocCreateInfo): Observable<any> {
        return this._http.post<any>(`${this._settingsService.apiUrl}/document`, docCreateInfo).pipe(
            tap(() => this._logger.info('Document created successfully')),
            catchError((error) => {
                this._logger.error('Failed to create document:', error);
                return of(null);
            })
        );
    }

    updateDocument(documentId: string, docUpdateInfo: DocUpdateInfo): Observable<any> {
        return this._http.patch<any>(`${this._settingsService.apiUrl}/document/${documentId}`, docUpdateInfo).pipe(
            catchError((error) => {
                this._logger.error('Error updating document', error);
                return throwError(() => error);
            })
        );
    }

    deleteDocuments(documentsId: string[], entiteId: number): Observable<void> {
        const queryParams = `documents_id=${documentsId.join('&documents_id=')}`;
        return this._http.delete<void>(`${this._settingsService.apiUrl}/entite/${entiteId}/documents?${queryParams}`).pipe(
            catchError((error) => {
                this._logger.error('Error deleting document', error);
                throw error;
            })
        );
    }

    uploadFiles(documentId: string, elementId: string, entiteId: number, files: File[]): Observable<any> {
        const formData: FormData = new FormData();
        files.forEach(file => {
            formData.append('files', file, file.name);
        });

        return this._http.post<any>(`${this._settingsService.apiUrl}/entite/${entiteId}/document/${documentId}/file/${elementId}`, formData).pipe(
            catchError((error) => {
                this._logger.error('Error uploading files', error);
                return of(null);
            })
        );
    }

    getDocumentById(documentId: string, entiteId: number | string): Observable<DocumentDetail> {
        return this._http.get<any>(`${this._settingsService.apiUrl}/entite/${entiteId}/document/${documentId}`).pipe(
            catchError((error) => {
                this._logger.error('Error get document', error);
                return of(null);
            })
        );
    }

    patchExternalData(entiteId: number, documentId: string, elementId: string, fileTypes: string[]): Observable<any> {
        return this._http.patch<any>(`${this._settingsService.apiUrl}/entite/${entiteId}/document/${documentId}/externalData/${elementId}`, fileTypes).pipe(
            catchError((error) => {
                this._logger.error('Error assigning file types', error);
                return throwError(() => error);
            })
        );
    }


    getDocuments(entiteId: number, idFlux: string = null, offset: number = 0, limit: number = 10): Observable<DocumentPaginate> {
        let queryParams = `offset=${offset}&limit=${limit}`;
        if (idFlux) {
            queryParams += `&type_flux=${idFlux}`;
        }

        return this._http.get<any>(`${this._settingsService.apiUrl}/entite/${entiteId}/documents?${queryParams}`).pipe(
            catchError((error) => {
                this._logger.error('Error get documents', error);
                return of(null);
            })
        );
    }

    deleteFileFromDocument(documentId: string, elementId: string, entiteId: number, fileName: string): Observable<any> {
        const body = { file_name: fileName };
        return this._http.request<any>('delete', `${this._settingsService.apiUrl}/entite/${entiteId}/document/${documentId}/file/${elementId}`, { body }).pipe(
            catchError((error) => {
                this._logger.error('Error deleting file from document', error);
                return throwError(() => error);
            })
        );
    }

    sendActe(documentId: string, entiteId: number): Observable<any> {
        return this._http.post<any>(`${this._settingsService.apiUrl}/entite/${entiteId}/document/${documentId}/send`, {}).pipe(
            catchError((error) => {
                this._logger.error('Error when sending document', error);
                return throwError(() => error);
            })
        );
    }


    /**
     * Redirige l'edition du document vers Pastell
     */
    redirectEditToPastell(document: DocumentInfo): void {
        window.open(`${this._settingsService.settings.pastellUrl}/Document/edition?id_d=${document.id_d}&id_e=${document.id_e}`)
    }
}
