import { inject, Injectable } from '@angular/core';
import { ActionPossible, ActionPossibleEnum, BaseDocumentInfo, DocCreateInfo, DocumentDetail, DocumentInfo, DocumentPaginate, DocUpdateInfo } from '../model/document.model';
import { HttpDocumentService } from './http/http-document.service';
import { NGXLogger } from 'ngx-logger';
import { LoadingService } from './loading.service';
import { catchError, concatMap, Observable, of, tap } from 'rxjs';
import { HttpFluxService } from './http/http-flux.service';



@Injectable({
    providedIn: 'root'
})
export class DocumentService {

    private readonly _httpDocumentService = inject(HttpDocumentService);
    private readonly _httpFluxService = inject(HttpFluxService);
    private readonly _logger = inject(NGXLogger);
    private readonly _loadingService = inject(LoadingService);


    sendActe(id_e: number, document: DocumentDetail): void {
        this._loadingService.showLoading("Envoi de l'acte en cours ...");
        this._httpDocumentService.performAction(document.info.id_d, id_e, ActionPossibleEnum.Orientation).subscribe({
            next: () => this._loadingService.showSuccess("Le document a bien été transmis.", ['/org', id_e.toString()])
        })
    }


    createDocument(id_e: number, doc: DocCreateInfo) {
        return this._httpDocumentService.createDocument(id_e, doc);
    }

    deleteDocuments(documentsId: string[], entiteId: number): Observable<void> {
        return this._httpDocumentService.deleteDocuments(documentsId, entiteId);
    }

    getDocuments(entiteId: number, idFlux: string = null, offset: number = 0, limit: number = 10): Observable<DocumentPaginate> {
        return this._httpDocumentService.getDocuments(entiteId, idFlux, offset, limit);
    }


    /**
    * Redirige l'edition du document vers Pastell
    */
    redirectEditToPastell(document: DocumentInfo): void {
        this._httpDocumentService.redirectEditToPastell(document)
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
        const updateDocument$ = this._httpDocumentService.updateDocument(id_e, id_d, docUpdateInfo).pipe(
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
     * Mise  àjours de type de piece
     * @param id_e id e de l'entité du document
     * @param id_d  id du document
     * @param data les données à Maj
     * @param _showSuccess indique si on affiche un loader pendant les évènements
     * @returns 
     */
    updateTypePiece(id_e: number, id_d: string, data: string[], _showSuccess = true): Observable<void> {
        this._loadingService.showLoading("Sauvegarde de l'acte en cours ...");
        return this._httpDocumentService.patchExternalData(id_e, id_d, 'type_piece', data).pipe(
            tap(() => { if (_showSuccess) this._loadingService.showSuccess('Le document a été créé et mis à jour avec succès.', ['/org', id_e.toString()]) }),
            catchError(error => {
                this._loadingService.showError(error.error.detail || 'Une erreur est survenue lors de la création ou de la mise à jour du document.');
                this._logger.error('Error fetching file types and files', error);
                return of(null);
            })
        );
    }

    /**
     * indique si le document peut être envoyé ('orientation')
     * @param document  le document à check
     */
    canSendActe(document: DocumentDetail): boolean {
        if (document.last_action === ActionPossibleEnum.Modification || document.last_action === ActionPossibleEnum.Creation) return true;

        return document.action_possible.some(a => a.action == ActionPossibleEnum.Orientation);
    }

    launchActionOnDocument(id_e: number, document: BaseDocumentInfo, action: ActionPossible) {
        this._loadingService.showLoading(`Action \`${action.message}\` en cours ...`);
        this._httpDocumentService.performAction(document.id_d, id_e, action.action).subscribe({
            next: () => this._loadingService.showSuccess("Action terminé", ['/org', id_e.toString()])
        })
    }

    /**
     * indique si le document peut être supprimé
     * @param document 
     */
    canDelete(document: DocumentDetail): boolean {
        return document.action_possible.some(a => a.action == ActionPossibleEnum.Suppression);
    }

    /**
     * Indique si le document est modifiable
     */
    canEdit(document: DocumentDetail): boolean {
        return (document.last_action === ActionPossibleEnum.Modification || document.last_action === ActionPossibleEnum.Creation);
    }
}