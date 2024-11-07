import { inject, Injectable } from '@angular/core';
import { ActionPossible, ActionPossibleEnum, BaseDocumentInfo, DocCreateInfo, DocumentActionDetails, DocumentDetail, DocumentInfo, DocumentPaginate, DocumentRequestAction, DocUpdateInfo } from '../model/document.model';
import { HttpDocumentService } from './http/http-document.service';
import { NGXLogger } from 'ngx-logger';
import { LoadingService } from './loading.service';
import { catchError, concatMap, map, Observable, of, switchMap, tap, timer } from 'rxjs';
import { ExternalDataObject, HttpFluxService } from './http/http-flux.service';
import { ActionResult } from '../model/flux-action.model';
import { RedirectModal } from '../model/modal.model';
import { UserContextService } from './user-context.service';


@Injectable({
    providedIn: 'root'
})
export class DocumentService {

    private readonly _httpDocumentService = inject(HttpDocumentService);
    private readonly _httpFluxService = inject(HttpFluxService);
    private readonly _logger = inject(NGXLogger);
    private readonly _loadingService = inject(LoadingService);
    private readonly _userContextService = inject(UserContextService)

    sendActe(id_e: number, document: DocumentDetail): void {
        this._loadingService.showLoading("Envoi de l'acte en cours ...");
        const actionRequest: DocumentRequestAction = { document_ids: document.info.id_d, action: ActionPossibleEnum.Orientation };
        const redirect = { route: ['/org', id_e.toString()] } as RedirectModal;
        if (this._userContextService.fluxSelected())
            redirect.params = { type: this._userContextService.fluxSelected()?.id };
        this._httpDocumentService.performAction(id_e, actionRequest).subscribe({
            next: () => this._loadingService.showSuccess("Le document a bien été transmis.", redirect)
        })
    }


    createDocument(id_e: number, doc: DocCreateInfo) {
        return this._httpDocumentService.createDocument(id_e, doc);
    }

    deleteDocuments(documentsId: string[], entiteId: number): Observable<void> {
        return this._httpDocumentService.deleteDocuments(documentsId, entiteId);
    }

    getDocuments(entiteId: number, idFlux: string = null, offset: number = 0, limit: number = 10): Observable<DocumentPaginate> {
        if (entiteId === UserContextService.ID_E_MERE) return of({ documents: [] } as DocumentPaginate);
        return this._httpDocumentService.getDocuments(entiteId, idFlux, offset, limit);
    }


    /**
    * Redirige l'edition du document vers Pastell
    */
    redirectToPastell(document: DocumentInfo): void {
        this._httpDocumentService.redirectToPastell(document)
    }


    /**
     * Lance la mise à jours du documents 
     * Fait un appel aux external Data pour récupérer les bonnes valeurs derrière
     * @param id_e 
     * @param id_d 
     * @param docUpdateInfo 
     * @returns 
     */
    updateDocument(id_e: number, id_d: string, docUpdateInfo: DocUpdateInfo): Observable<ExternalDataObject> {
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
        const redirect = { route: ['/org', id_e.toString()] } as RedirectModal;
        if (this._userContextService.fluxSelected())
            redirect.params = { type: this._userContextService.fluxSelected()?.id };
        return this._httpDocumentService.patchExternalData(id_e, id_d, 'type_piece', data).pipe(
            tap(() => { if (_showSuccess) this._loadingService.showSuccess('Le document a été créé et mis à jour avec succès.', redirect) }),
            catchError(error => {
                this._loadingService.showError(error.error.detail || 'Une erreur est survenue lors de la création ou de la mise à jour du document.');
                this._logger.error('Error fetching file types and files', error);
                return of(null);
            })
        )
    }

    /**
     * indique si le document peut être envoyé ('orientation')
     * @param document  le document à check
     */
    canSendActe(document: DocumentDetail): boolean {
        if (document.last_action === ActionPossibleEnum.Modification || document.last_action === ActionPossibleEnum.Creation) return true;

        return document.action_possible.some(a => a.action == ActionPossibleEnum.Orientation);
    }

    /**
     * Lance l'action sur un document
     * @param id_e  id de l'entité
     * @param document le document
     * @param action l'action à lancer
     * @param params autre paramètre pour gérer les actions éventuelles
     * 
     */
    launchActionOnDocument(id_e: number, document: BaseDocumentInfo, action: ActionPossible): Observable<ActionResult | null> {
        this._loadingService.showLoading(`Action \`${action.message}\` en cours ...`);
        const actionRequest: DocumentRequestAction = { document_ids: document.id_d, action: action.action };
        return this._httpDocumentService.performAction(id_e, actionRequest).pipe(
            map((result: ActionResult) => {
                console.log("dans le map de launch");
                if (action.action === ActionPossibleEnum.Teletransmission_TDT && result.data.url) {
                    const url_return = `/retour-tdt?id_e=${id_e}&id_d=${document.id_d}&error=%%ERROR%%&message=%%MESSAGE%%`;
                    this._redirectTdt(`${result.data.url}&url_return=${window.location.protocol}//${window.location.host}${encodeURIComponent(url_return)}`);
                    return null;
                }
                return result
            })

        )
    }

    /**
     * Lance une action sur plusieurs documents
     * @param id_e 
     * @param documents 
     * @param action 
     */
    launchActionOnMultiDocuments(id_e: number, documents: BaseDocumentInfo[], action: ActionPossible): Observable<ActionResult | null> {
        this._loadingService.showLoading(`Action \`${action.message}\` multiple en cours ...`);
        const actionRequest: DocumentRequestAction = { document_ids: documents.map(d => d.id_d), action: action.action };

        return this._httpDocumentService.performAction(id_e, actionRequest).pipe(
            map((result: ActionResult) => {
                if (action.action === ActionPossibleEnum.Teletransmission_TDT && result.data.url) {
                    const url_return = `/retour-tdt?id_e=${id_e}&id_d[]=${documents.map(d => d.id_d).join('&id_d[]=')}`;
                    this._redirectTdt(`${result.data.url}&url_return=${window.location.protocol}//${window.location.host}${encodeURIComponent(url_return)}`);
                    return null;
                }
                return result
            })

        )
    }

    /**
     * Lance l'action de verification après un retour Tdt
     * @param id_e id de l'entité
     * @param id_d id du document
     * @returns 
     */
    retourTdt(id_e: number, id_d: string | string[]): Observable<ActionResult> {
        const actionRequest: DocumentRequestAction = { document_ids: id_d, action: ActionPossibleEnum.Verification_TDT };
        return this._httpDocumentService.performAction(id_e, actionRequest);
    }

    /**
     * Lance l'action de verification après un retour Tdt avec un délai
     * @param id_e 
     * @param id_d 
     * @param delay 
     */
    retourTdtWithDelay(id_e: number, id_d: string | string[], delay: number = 5000): void {
        const actionRequest: DocumentRequestAction = { document_ids: id_d, action: ActionPossibleEnum.Verification_TDT };
        timer(delay).pipe(
            switchMap(() => this._httpDocumentService.performAction(id_e, actionRequest))
        ).subscribe(
            {
                next: () => { this._logger.info('Retour Tdt OK') },
                error: () => { this._logger.error('Erreur retour TDT') }
            }
        );
    }

    /**
     * indique si le document peut être supprimé
     * @param document 
     */
    canDelete(document: DocumentDetail | DocumentInfo): boolean {
        return document.action_possible.some(a => a.action == ActionPossibleEnum.Suppression);
    }

    /**
     * Donne la liste d'actions possible multiple
     */
    getActionMultiAuthorize(): ActionPossibleEnum[] {
        return [ActionPossibleEnum.Suppression, ActionPossibleEnum.Orientation, ActionPossibleEnum.Teletransmission_TDT];
    }

    /**
     * indique si le document peut être transmis au TDT
     * @param document 
     * @returns 
     */
    canSendToTdt(document: DocumentDetail | DocumentInfo): boolean {
        return document.action_possible.some(a => a.action == ActionPossibleEnum.Teletransmission_TDT);
    }

    /**
     * Indique si le document est modifiable
     */
    canEdit(document: DocumentActionDetails): boolean {
        return (document.last_action === ActionPossibleEnum.Modification || document.last_action === ActionPossibleEnum.Creation);
    }

    private _redirectTdt(url: string) {
        window.location.href = url;
    }
}