import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { DocCreateInfo, DocumentDetail, DocumentInfo, DocumentPaginate, DocUpdateInfo, DocumentRequestAction } from "../../model/document.model";
import { Observable, catchError, of, tap, throwError } from "rxjs";
import { NGXLogger } from "ngx-logger";
import { SettingsService } from "src/environments/settings.service";
import { ActionResult } from "../../model/flux-action.model";

@Injectable({
    providedIn: 'root'
})
export class HttpDocumentService {
    private readonly _http = inject(HttpClient);
    private readonly _logger = inject(NGXLogger);
    private readonly _settingsService = inject(SettingsService);

    createDocument(entiteId: number, docCreateInfo: DocCreateInfo): Observable<DocumentDetail> {
        return this._http.post<DocumentDetail>(`${this._settingsService.apiUrl}/entite/${entiteId}/document`, docCreateInfo).pipe(
            tap(() => this._logger.info('Document created successfully')),
            catchError((error) => {
                this._logger.error('Failed to create document:', error);
                return of(null);
            })
        );
    }

    updateDocument(entiteId: number, documentId: string, docUpdateInfo: DocUpdateInfo): Observable<{ content: DocumentDetail }> {
        return this._http.patch<{ content: DocumentDetail }>(`${this._settingsService.apiUrl}/entite/${entiteId}/document/${documentId}`, docUpdateInfo).pipe(
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

    uploadFiles(documentId: string, elementId: string, entiteId: number, files: File[]): Observable<void> {
        const formData: FormData = new FormData();
        files.forEach(file => {
            formData.append('files', file, file.name);
        });

        return this._http.post<void>(`${this._settingsService.apiUrl}/entite/${entiteId}/document/${documentId}/file/${elementId}`, formData).pipe(
            catchError((error) => {
                this._logger.error('Error uploading files', error);
                return of(null);
            })
        );
    }

    getDocumentById(documentId: string, entiteId: number | string): Observable<DocumentDetail> {
        return this._http.get<DocumentDetail>(`${this._settingsService.apiUrl}/entite/${entiteId}/document/${documentId}`).pipe(
            catchError((error) => {
                this._logger.error('Error get document', error);
                return of(null);
            })
        );
    }

    patchExternalData(entiteId: number, documentId: string, elementId: string, fileTypes: string[]): Observable<void> {
        return this._http.patch<void>(`${this._settingsService.apiUrl}/entite/${entiteId}/document/${documentId}/externalData/${elementId}`, fileTypes).pipe(
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

        return this._http.get<DocumentPaginate>(`${this._settingsService.apiUrl}/entite/${entiteId}/documents?${queryParams}`).pipe(
            catchError((error) => {
                this._logger.error('Error get documents', error);
                return of(null);
            })
        );
    }

    deleteFileFromDocument(documentId: string, elementId: string, entiteId: number, fileName: string): Observable<void> {
        const body = { file_name: fileName };
        return this._http.request<void>('delete', `${this._settingsService.apiUrl}/entite/${entiteId}/document/${documentId}/file/${elementId}`, { body }).pipe(
            catchError((error) => {
                this._logger.error('Error deleting file from document', error);
                return throwError(() => error);
            })
        );
    }

    performAction(entiteId: number, actionRequest: DocumentRequestAction): Observable<ActionResult> {
        return this._http.post<ActionResult>(`${this._settingsService.apiUrl}/entite/${entiteId}/documents/perform_action`, actionRequest).pipe(
            catchError((error) => {
                this._logger.error('Error when perform Action on document', error);
                return throwError(() => error);
            })
        );
    }


    /**
     * Redirige vers Pastell
     */
    redirectToPastell(document: DocumentInfo): void {
        window.open(`${this._settingsService.settings.pastellUrl}/Document/detail?id_d=${document.id_d}&id_e=${document.id_e}`, '_blank')
    }


}
