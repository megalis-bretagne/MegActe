import { forkJoin, Observable, of, switchMap } from 'rxjs';
import { FluxService } from '../services/flux.service';
import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { DocumentService } from '../services/document.service';
import { UserContextService } from '../services/user-context.service';
import { DocumentDetail } from '../model/document.model';



export const DocumentDetailResolver: ResolveFn<any> = (
    route
): Observable<{ document: DocumentDetail, flux: any } | null> => {
    const fluxService = inject(FluxService);
    const documentService = inject(DocumentService);
    const userCurrent = inject(UserContextService).userCurrent();
    const userFlux = inject(UserContextService).userFlux();
    const docId = route.paramMap.get('documentId');
    if (docId) {
        // TODO modifier quand l'entité courrant change

        return documentService.getDocumentById(docId, userCurrent.user_info.id_e).pipe(
            switchMap((docDetail: DocumentDetail) => {
                const idFlux = docDetail.info.type;
                if (idFlux) {
                    // on sélectionner le flux courant en fonction du document
                    fluxService.selectCurrentFlux(userFlux.find(acte => acte.id === idFlux));
                    return forkJoin({
                        document: of(docDetail),
                        flux: fluxService.get_flux_detail(idFlux)
                    });
                }
                return of(null);
            })
        ); // doit récupérer le id_flux

    }
    return of(null);
};


