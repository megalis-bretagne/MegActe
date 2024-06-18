import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuthGuardService } from './services/keycloakServices/auth-guard.service';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { ActeFormComponent } from './components/acte-form/acte-form.component';
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
        path: 'acte/:nom',
        component: ActeFormComponent,
        resolve: { fluxDetail: FluxResolver }
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