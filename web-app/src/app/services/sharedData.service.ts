import { Injectable } from '@angular/core';
import { UserContext } from 'src/app/model/user.model';
import { Acte } from 'src/app/model/acte.model';
import { FluxDetailItem } from '../model/field-form.model';

@Injectable({
    providedIn: 'root'
})
export class SharedDataService {
    private user: UserContext;
    private flux: Acte[];
    private fluxDetail: { [key: string]: FluxDetailItem };

    setUser(user: UserContext) {
        this.user = user;
    }

    getUser(): UserContext {
        return this.user;
    }

    setFlux(flux: Acte[]) {
        this.flux = flux;
    }

    getFlux(): Acte[] {
        return this.flux;
    }

    setFluxDetail(fluxDetail: { [key: string]: FluxDetailItem }) {
        this.fluxDetail = fluxDetail;
    }

    getFluxDetail(): { [key: string]: FluxDetailItem } {
        return this.fluxDetail;
    }

    //Récupère l'ID d'un champ en fonction de son nom à partir du flux.
    getFieldByName(acteNom: string): string | undefined {
        const acte = this.flux.find(acte => acte.nom === acteNom);
        return acte ? acte.id : undefined;
    }
}
