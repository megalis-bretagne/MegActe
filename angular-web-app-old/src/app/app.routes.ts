import { Routes } from '@angular/router';
import { AuthGuardService } from './core/services/guards/auth-guard.service';
import { ActeFormComponent } from './pages/acte-form/acte-form.component';
import { documentDetailResolver } from './core/resolvers/document-detail.resolver';
import { entiteSelectedResolver } from './core/resolvers/entite-selected.resolver';
import { TdtComponent } from './pages/tdt/tdt.component';
import { fluxSelectedResolver } from './core/resolvers/flux-selected.resolver';


export const routes: Routes = [
    {
        path: '',
        canActivate: [AuthGuardService],  // Applique la guard à toutes les routes enfants
        resolve: { entiteSelected: entiteSelectedResolver },
        runGuardsAndResolvers: 'always',
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
            },
            {
                path: 'org/:ide',
                runGuardsAndResolvers: 'pathParamsOrQueryParamsChange',// set le flux
                resolve: { fluxSelected: fluxSelectedResolver },
                loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
            },
            {
                path: 'user-profile',
                loadComponent: () => import('./pages/user-profile/user-profile.component').then(m => m.UserProfileComponent),
            },
            {
                path: 'org/:ide/acte/:documentId',
                component: ActeFormComponent,
                resolve: { docDetail: documentDetailResolver },
            },
            {
                path: 'retour-tdt', // route pour gérer le retour du TDT après authentification
                component: TdtComponent
            },
            {
                path: '**',
                redirectTo: ''
            }
        ]
    }
];