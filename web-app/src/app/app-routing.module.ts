import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AuthGuardService } from './services/keycloakServices/auth-guard.service';
import { UserProfileComponent } from './pages/user-profile/user-profile.component';
import { ActeFormComponent } from './pages/acte-form/acte-form.component';
import { FluxResolver } from './resolvers/flux.resolver';

const routes: Routes = [
    {
        path: '',
        component: DashboardComponent,
        canActivate: [AuthGuardService],
    },
    {
        path: 'user-profile',
        component: UserProfileComponent,
    },
    {
        path: 'acte/:documentId',
        component: ActeFormComponent,
        resolve: { fluxDetail: FluxResolver },
    },
    {
        path: 'documents/:typeNom',
        loadComponent: () => import('./pages/document-list/document-list.component').then(m => m.DocumentListComponent)
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