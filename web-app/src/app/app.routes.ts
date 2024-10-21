import { Routes } from '@angular/router';
import { AuthGuardService } from './core/services/guards/auth-guard.service';
import { ActeFormComponent } from './pages/acte-form/acte-form.component';
import { documentDetailResolver } from './core/resolvers/document-detail.resolver';
import { entiteSelectedResolver } from './core/resolvers/entite-selected.resolver';
import { TdtComponent } from './pages/tdt/tdt.component';


export const routes: Routes = [
    {
        path: '',
        canActivate: [AuthGuardService],  // Applique la guard à toutes les routes enfants
        resolve: { entiteSelected: entiteSelectedResolver }, // set l'entité
        runGuardsAndResolvers: 'always',
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
            },
            {
                path: 'org/:ide',
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
                path: 'return-tdt',
                component: TdtComponent
            },
            {
                path: '**',
                redirectTo: ''
            }
        ]
    }
];