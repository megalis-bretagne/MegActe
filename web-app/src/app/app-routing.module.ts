import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuthGuardService } from './services/keycloakServices/auth-guard.service';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { UserContextResolver, UserFluxResolver } from './resolvers/user.resolver';

const routes: Routes = [
    {
        path: '',
        component: DashboardComponent,
        canActivate: [AuthGuardService],
        resolve: {
            userContext: UserContextResolver,
            userFlux: UserFluxResolver
        }
    },
    {
        path: 'user-profile',
        component: UserProfileComponent,
        resolve: {
            userContext: UserContextResolver
        }
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