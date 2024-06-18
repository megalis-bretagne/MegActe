import { Injectable } from '@angular/core';
import { UserContext } from 'src/app/model/user.model';
import { Acte } from 'src/app/model/acte.model';

@Injectable({
    providedIn: 'root'
})
export class SharedDataService {
    private user: UserContext;
    private flux: Acte[];

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

    //Récupère l'ID d'un champ en fonction de son nom à partir du flux.
    getFieldByName(acteNom: string): string | undefined {
        const acte = this.flux.find(acte => acte.nom === acteNom);
        return acte ? acte.id : undefined;
    }
}
