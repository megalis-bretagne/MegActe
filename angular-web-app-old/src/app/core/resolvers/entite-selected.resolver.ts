import { inject } from "@angular/core";
import { ActivatedRouteSnapshot, ResolveFn } from "@angular/router";
import { UserContextService } from "../services/user-context.service";

export const entiteSelectedResolver: ResolveFn<void> = (_route, tmpRoute): void => {
    const userContexteService = inject(UserContextService);

    if (userContexteService.userCurrent() === null)
        return;

    const allParams = getAllRouteParams(tmpRoute.root);
    const ide = allParams['ide'] || null; // Récupère le paramètre :ide

    if (ide === null || Number(ide) <= 0) { // si ide est null ou < 0
        userContexteService.setEntiteSelected(userContexteService.userCurrent().entite);
        return;
    }
    const actualEntiteSelected = userContexteService.entiteSelected();

    if (actualEntiteSelected && actualEntiteSelected.id_e === Number(ide)) return; // si pas de changement on sort

    const entite = userContexteService.findEntiteById(Number(ide));
    if (entite) {
        userContexteService.setEntiteSelected(entite);
    } else {
        userContexteService.setEntiteSelected(userContexteService.userCurrent().entite);
    }
}

export const getAllRouteParams = (route: ActivatedRouteSnapshot): { [key: string]: string } | null => {
    let params = { ...route.params };

    // Parcours récursif des enfants pour récupérer les paramètres des routes enfants
    route.children.forEach(childRoute => {
        params = { ...params, ...getAllRouteParams(childRoute) };
    });

    return params;
}