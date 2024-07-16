import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuardService } from './services/keycloakServices/auth-guard.service';
import { DocumentDetailResolver } from './resolvers/document-detail.resolver';
import { ActeFormComponent } from './pages/acte-form/acte-form.component';

const routes: Routes = [
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
        path: 'acte/:documentId',
        component: ActeFormComponent,
        resolve: { docDetail: DocumentDetailResolver },
    },
    {
        path: '**',
        redirectTo: ''
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }