import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';


import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular';
import { SettingsHttpService } from 'src/environments/settings.http.service';
import { HttpClientModule } from '@angular/common/http';

import { SettingsService } from 'src/environments/settings.service';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

@NgModule({
    declarations: [
        AppComponent,
        DashboardComponent,
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
            deps: [SettingsHttpService, KeycloakService, SettingsService],
            multi: true
        }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }

export function app_Init(settingsHttpService: SettingsHttpService): () => Promise<any> {
    return () => settingsHttpService.initializeApp();
}
