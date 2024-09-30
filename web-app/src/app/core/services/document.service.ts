import { inject, Injectable } from '@angular/core';
import { ActionPossibleEnum, DocumentDetail, DocUpdateInfo, LastActionEnum } from '../model/document.model';
import { HttpDocumentService } from './http/http-document.service';
import { NGXLogger } from 'ngx-logger';
import { LoadingService } from './loading.service';
import { catchError, concatMap, Observable, of, switchMap, tap } from 'rxjs';
import { HttpFluxService } from './http/http-flux.service';


@Injectable({
    providedIn: 'root'
})
export class DocumentService {

    private _httpDocumentService = inject(HttpDocumentService);
    private _httpFluxService = inject(HttpFluxService);
    private _logger = inject(NGXLogger);
    private _loadingService = inject(LoadingService);


    sendActe(document: DocumentDetail): void {
        return;
    }


    /**
     * Lance la mise à jours du documents 
     * Fait un appel aux external Data pour récupérer les bonnes valeurs derrière
     * @param id_e 
     * @param id_d 
     * @param docUpdateInfo 
     * @returns 
     */
    updateDocument(id_e: number, id_d: string, docUpdateInfo: DocUpdateInfo): Observable<any> {
        this._loadingService.showLoading("Sauvegarde en cours ...");
        // Création d'un observable pour la mise à jour du document
        const updateDocument$ = this._httpDocumentService.updateDocument(id_d, docUpdateInfo).pipe(
            catchError(error => {
                this._logger.error('Error updating document', error);
                return of(null);
            })
        );
        //@TODO type_piece pour les delib .. voir pour retirer en dur
        const fetchTypePiece$ = this._httpFluxService.get_externalData(id_e, id_d, 'type_piece').pipe(
            tap(() => this._loadingService.hideLoading()),
            catchError(error => {
                this._logger.error('Error fetching file types and files', error);
                return of(null);
            })
        );
        return updateDocument$.pipe(
            concatMap(() => {
                // Appel de la deuxième requête
                return fetchTypePiece$;
            })
        );

    }


    /**
     * Assigne les Typologie de Piece à un document
     */
    assignTypePiece(id_e: number, id_d: string, data: string[]): void {
        this._loadingService.showLoading("Sauvegarde de l'acte en cours ...");
        this._httpDocumentService.patchExternalData(id_e, id_d, 'type_piece', data).subscribe({
            next: (response) => {
                this._loadingService.showSuccess('Le document a été créé et mis à jour avec succès.', ['/org', id_e.toString()]);
                this._logger.info('File types assigned successfully', response);
            },
            error: (error) => {
                this._loadingService.showError(error.error.detail || 'Une erreur est survenue lors de la création ou de la mise à jour du document.');
                this._logger.error('Error assigning file types', error);
            }
        });
    }

    /**
     * indique si le document peut être envoyé ('orientation')
     * @param document  le document à check
     */
    canSendActe(document: DocumentDetail): boolean {
        if (document.last_action.action === LastActionEnum.Modification || document.last_action.action === LastActionEnum.Creation) return true;

        return document.action_possible.includes(ActionPossibleEnum.Orientation);
    }

    /**
     * indique si le document peut être supprimé
     * @param document 
     */
    canDelete(document: DocumentDetail): boolean {
        return document.action_possible.includes(ActionPossibleEnum.Suppression);
    }
}