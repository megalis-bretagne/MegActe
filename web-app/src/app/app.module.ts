import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';


import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular';
import { HttpClientModule } from '@angular/common/http';

import { SettingsService } from 'src/environments/settings.service';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { UserProfileComponent } from './pages/user-profile/user-profile.component';
import { UserService } from './services/user.service';
import { AppInitService } from 'src/environments/app.init.service';
import { SharedDataService } from './services/sharedData.service';
import { LoadingTemplateComponent } from './components/loading-template/loading-template.component';
import { ActeFormComponent } from './pages/acte-form/acte-form.component';
import { TextInputComponent } from './components/flux/text-input/text-input.component';
import { CheckboxInputComponent } from './components/flux/checkbox-input/checkbox-input.component';
import { SelectInputComponent } from './components/flux/select-input/select-input.component';
import { DateInputComponent } from './components/flux/date-input/date-input.component';
import { FileUploadComponent } from './components/flux/file-upload/file-upload.component';
import { DragAndDropDirective } from './shared/directives/drag-and-drop.directive';


@NgModule({
    declarations: [
        AppComponent,
        DashboardComponent,
        NavbarComponent,
        SidebarComponent,
        UserProfileComponent,
        LoadingTemplateComponent,
        ActeFormComponent,
        TextInputComponent,
        CheckboxInputComponent,
        SelectInputComponent,
        DateInputComponent,
        FileUploadComponent,
        DragAndDropDirective
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        KeycloakAngularModule,
        HttpClientModule,
        LoggerModule.forRoot({ level: NgxLoggerLevel.WARN }),
    ],
    providers: [
        {
            provide: APP_INITIALIZER,
            useFactory: app_Init,
            deps: [AppInitService, KeycloakService, SettingsService, UserService, SharedDataService],
            multi: true
        },
        provideAnimationsAsync()
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }

export function app_Init(appInitService: AppInitService): () => Promise<any> {
    return () => appInitService.initializeApp();
}
