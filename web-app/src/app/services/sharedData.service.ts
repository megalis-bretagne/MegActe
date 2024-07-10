import { Injectable, inject } from '@angular/core';
import { UserContext } from 'src/app/model/user.model';
import { Acte } from 'src/app/model/acte.model';
import { FluxDetailItem } from '../model/field-form.model';
import { UserService } from 'src/app/services/user.service';

@Injectable({
    providedIn: 'root'
})
/** @deprecated Prejer user Signals **/
export class SharedDataService {
    private user = inject(UserService).userCurrent;

    private flux = inject(UserService).userFlux;

    private fluxDetail: { [key: string]: FluxDetailItem };
    private acteID: string;


    getUser(): UserContext {
        return this.user();
    }

    getFlux(): Acte[] {
        return this.flux();
    }

    setFluxDetail(fluxDetail: { [idField: string]: FluxDetailItem }) {
        this.fluxDetail = fluxDetail;
    }

    getFluxDetail(): { [idField: string]: FluxDetailItem } {
        return this.fluxDetail;
    }

    //Récupère l'ID d'un champ en fonction de son nom à partir du flux.
    getFieldByName(acteNom: string): string | undefined {
        const acte = this.flux().find(acte => acte.nom === acteNom);
        return acte ? acte.id : undefined;
    }

    setActeID(acteID: string) {
        this.acteID = acteID;
    }

    getActeID(): string {
        return this.acteID;
    }
    // Récupère l'ID d'un champ en fonction de son nom à partir des détails du flux.
    getFieldIdFromFluxDetailByName(fieldName: string): string | undefined {
        if (this.fluxDetail) {
            const entry = Object.entries(this.fluxDetail).find(([key, value]) => value.name === fieldName);
            return entry ? entry[0] : undefined;
        }
        return undefined;
    }
}
