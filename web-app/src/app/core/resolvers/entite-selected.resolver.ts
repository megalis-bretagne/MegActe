import { inject } from "@angular/core";
import { ActivatedRouteSnapshot, ResolveFn } from "@angular/router";
import { UserContextService } from "../services/user-context.service";

export const entiteSelectedResolver: ResolveFn<void> = (route, tmpRoute): void => {
    const userContexteService = inject(UserContextService);
    const allParams = getAllRouteParams(tmpRoute.root);
    const ide = allParams['ide'] || null; // Récupère le paramètre :ide

    const entite = userContexteService.findEntiteById(Number(ide));
    if (entite) {
        userContexteService.setEntiteSelected(entite);
    } else {
        userContexteService.setEntiteSelected(userContexteService.userCurrent().entite);
    }

    const type_flux = route.queryParams['type'] || null;
    if (type_flux) userContexteService.selectCurrentFlux(type_flux);
}

export const getAllRouteParams = (route: ActivatedRouteSnapshot): { [key: string]: string } | null => {
    let params = { ...route.params };

    // Parcours récursif des enfants pour récupérer les paramètres des routes enfants
    route.children.forEach(childRoute => {
        params = { ...params, ...getAllRouteParams(childRoute) };
    });

    return params;
}