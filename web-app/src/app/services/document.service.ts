import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { DocCreateInfo, DocUpdateInfo } from "../model/document.model";
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
}