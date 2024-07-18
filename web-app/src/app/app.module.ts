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
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { AppInitService } from 'src/environments/app.init.service';
import { ExternalDataInputComponent } from './components/flux/external-data-input/external-data-input.component';
import { DocumentListComponent } from './components/document-list/document-list.component';
import { UserContextService } from './services/user-context.service';


@NgModule({
    declarations: [
        AppComponent,
        NavbarComponent,
        SidebarComponent
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
        ExternalDataInputComponent,
        DocumentListComponent,
    ],
    providers: [
        {
            provide: APP_INITIALIZER,
            useFactory: app_Init,
            deps: [AppInitService, KeycloakService, SettingsService, UserContextService],
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
