import { inject } from "@angular/core";
import { ResolveFn } from "@angular/router";
import { UserContextService } from "../services/user-context.service";

export const fluxSelectedResolver: ResolveFn<void> = (route, _tmpRoute): void => {
    const userContexteService = inject(UserContextService);
    const type_flux = route.queryParams['type'] || null;
    userContexteService.selectCurrentFlux(type_flux);
}