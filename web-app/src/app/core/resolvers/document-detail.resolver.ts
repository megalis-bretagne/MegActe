import { forkJoin, Observable, of, switchMap, tap } from 'rxjs';
import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { HttpDocumentService } from '../services/http/http-document.service';
import { UserContextService } from '../services/user-context.service';
import { DocumentDetail } from '../model/document.model';
import { LoadingService } from '../services/loading.service';
import { HttpFluxService } from '../services/http/http-flux.service';
import { Flux } from '../model/flux.model';



export const documentDetailResolver: ResolveFn<{ document: DocumentDetail, flux: { [key: string]: Flux } } | null> = (
    route
): Observable<{ document: DocumentDetail, flux: { [key: string]: Flux } } | null> => {
    const userContexteService = inject(UserContextService);
    const fluxService = inject(HttpFluxService);
    const documentService = inject(HttpDocumentService);
    const docId = route.paramMap.get('documentId');
    const id_e = route.paramMap.get('ide');
    const loadingService = inject(LoadingService);
    if (docId) {
        return documentService.getDocumentById(docId, id_e).pipe(
            switchMap((docDetail: DocumentDetail) => {
                const idFlux = docDetail.info.type;
                if (idFlux) {
                    // on sélectionner le flux courant en fonction du document
                    return forkJoin({
                        document: of(docDetail),
                        flux: fluxService.get_flux_detail(idFlux)
                    }).pipe(
                        tap(() => { loadingService.hideLoading(); userContexteService.selectCurrentFlux(idFlux); })
                    );
                }
                return of(null);
            })
        ); // doit récupérer le id_flux

    }
    return of(null);
};


