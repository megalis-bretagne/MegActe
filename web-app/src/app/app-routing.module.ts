import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuardService } from './services/keycloakServices/auth-guard.service';
import { FluxResolver } from './resolvers/flux.resolver';
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
        path: 'acte/:documentId',
        component: ActeFormComponent,
        resolve: { fluxDetail: FluxResolver },
    },
    // {
    //     path: 'documents/:typeNom',
    //     loadComponent: () => import('./pages/document-list/document-list.component').then(m => m.DocumentListComponent)
    // },
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