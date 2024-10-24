import { inject } from "@angular/core";
import { ActivatedRouteSnapshot, ResolveFn } from "@angular/router";
import { UserContextService } from "../services/user-context.service";

export const entiteSelectedResolver: ResolveFn<void> = (_route, tmpRoute): void => {
    const userContexteService = inject(UserContextService);
    const allParams = getAllRouteParams(tmpRoute.root);
    const ide = allParams['ide'] || null; // Récupère le paramètre :ide

    const entite = userContexteService.findEntiteById(Number(ide));
    if (entite) {
        userContexteService.setEntiteSelected(entite);
    } else {
        userContexteService.setEntiteSelected(userContexteService.userCurrent().entites[0]);
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