import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuthGuardService } from './services/keycloakServices/auth-guard.service';
import { UserProfileComponent } from './components/user-profile/user-profile.component';

const routes: Routes = [
    {
        path: '',
        component: DashboardComponent,
        canActivate: [AuthGuardService]
    },
    {
        path: 'user-profile',
        component: UserProfileComponent
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