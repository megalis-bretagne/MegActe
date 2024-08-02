import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { DocCreateInfo, DocumentDetail, DocumentPaginate, DocUpdateInfo } from "../model/document.model";
import { Observable, catchError, of, tap, throwError } from "rxjs";
import { NGXLogger } from "ngx-logger";
import { SettingsService } from "src/environments/settings.service";

@Injectable({
    providedIn: 'root'
})
export class DocumentService {


    constructor(private http: HttpClient, private logger: NGXLogger, private settingsService: SettingsService) { }

    createDocument(docCreateInfo: DocCreateInfo): Observable<any> {
        return this.http.post<any>(`${this.settingsService.apiUrl}/document`, docCreateInfo).pipe(
            tap(() => this.logger.info('Document created successfully')),
            catchError((error) => {
                this.logger.error('Failed to create document:', error);
                return of(null);
            })
        );
    }

    updateDocument(documentId: string, docUpdateInfo: DocUpdateInfo): Observable<any> {
        return this.http.patch<any>(`${this.settingsService.apiUrl}/document/${documentId}`, docUpdateInfo).pipe(
            catchError((error) => {
                this.logger.error('Error updating document', error);
                return throwError(() => error);
            })
        );
    }

    deleteDocument(documentId: string, entiteId: number): Observable<any> {
        const params = new HttpParams().set('entite_id', entiteId);
        return this.http.delete<any>(`${this.settingsService.apiUrl}/document/${documentId}`, { params }).pipe(
            catchError((error) => {
                this.logger.error('Error deleting document', error);
                throw error;
            })
        );
    }

    transferTdtDocument(documentId: string, entiteId: number): Observable<any> {
        const params = new HttpParams().set('entite_id', entiteId.toString());
        return this.http.post<any>(`${this.settingsService.apiUrl}/document/${documentId}/transfer-tdt`, {}, { params }).pipe(
            catchError((error) => {
                this.logger.error('Error transferring document', error);
                return of(null);
            })
        );
    }

    cancelTdtDocument(documentId: string, entiteId: number): Observable<any> {
        const params = new HttpParams().set('entite_id', entiteId.toString());
        return this.http.post<any>(`${this.settingsService.apiUrl}/document/${documentId}/cancel-tdt`, {}, { params }).pipe(
            catchError((error) => {
                this.logger.error('Error cancelling document transfer', error);
                return of(null);
            })
        );
    }

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

    getDocumentById(documentId: string, entiteId: number): Observable<DocumentDetail> {
        return this.http.get<any>(`${this.settingsService.apiUrl}/document/${documentId}?entite_id=${entiteId}`).pipe(
            catchError((error) => {
                this.logger.error('Error get document', error);
                return of(null);
            })
        );
    }
    assignFileTypes(entiteId: number, documentId: string, elementId: string, fileTypes: string[]): Observable<any> {
        return this.http.patch<any>(`${this.settingsService.apiUrl}/document/${documentId}/file/${elementId}/types?entite_id=${entiteId}`, fileTypes).pipe(
            catchError((error) => {
                this.logger.error('Error assigning file types', error);
                return throwError(() => error);
            })
        );
    }


    getDocuments(entiteId: number, idFlux: string = null, offset: number = 0, limit: number = 10): Observable<DocumentPaginate> {
        let queryParams = `offset=${offset}&limit=${limit}`;
        if (idFlux) {
            queryParams += `&type_flux=${idFlux}`;
        }

        return this.http.get<any>(`${this.settingsService.apiUrl}/entite/${entiteId}/documents?${queryParams}`).pipe(
            catchError((error) => {
                this.logger.error('Error get documents', error);
                return of(null);
            })
        );
    }

    downloadFileByName(entiteId: number, documentId: string, elementId: string, fileName: string): Observable<Blob> {
        return this.http.get(`${this.settingsService.apiUrl}/document/${documentId}/file/${elementId}/${fileName}?entite_id=${entiteId}`, { responseType: 'blob' }).pipe(
            catchError((error) => {
                this.logger.error('Error downloading file', error);
                return of(null);
            })
        );
    }

    deleteFileFromDocument(documentId: string, elementId: string, entiteId: number, fileName: string): Observable<any> {
        const body = { entite_id: entiteId, file_name: fileName };
        return this.http.request<any>('delete', `${this.settingsService.apiUrl}/document/${documentId}/file/${elementId}`, { body }).pipe(
            catchError((error) => {
                this.logger.error('Error deleting file from document', error);
                return throwError(() => error);
            })
        );
    }
}
