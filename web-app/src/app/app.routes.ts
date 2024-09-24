import { Routes } from '@angular/router';
import { AuthGuardService } from './core/services/guards/auth-guard.service';
import { ActeFormComponent } from './pages/acte-form/acte-form.component';
import { DocumentDetailResolver } from './core/resolvers/document-detail.resolver';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [AuthGuardService],
    },
    {
        path: 'user-profile',
        loadComponent: () => import('./pages/user-profile/user-profile.component').then(m => m.UserProfileComponent),
    },
    {
        // TODO ajouter l'id de l'entité quand la sélection des entités sera à faire
        path: 'org/:ide/acte/:documentId',
        component: ActeFormComponent,
        resolve: { docDetail: DocumentDetailResolver },
    },
    {
        path: '**',
        redirectTo: ''
    }
];
