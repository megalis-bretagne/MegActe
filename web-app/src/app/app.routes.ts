import { Routes } from '@angular/router';
import { AuthGuardService } from './core/services/guards/auth-guard.service';
import { ActeFormComponent } from './pages/acte-form/acte-form.component';
import { DocumentDetailResolver } from './core/resolvers/document-detail.resolver';
import { EntiteSelectedResolver } from './core/resolvers/entite-selected.resolver';


export const routes: Routes = [
    {
        path: '',
        canActivate: [AuthGuardService],  // Applique la guard à toutes les routes enfants
        resolve: { entiteSelected: EntiteSelectedResolver }, // set l'entité
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
                resolve: { docDetail: DocumentDetailResolver },
            },
            {
                path: '**',
                redirectTo: ''
            }
        ]
    }
];