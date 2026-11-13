import {
  APP_INITIALIZER,
  ApplicationConfig,
  importProvidersFrom,
  provideExperimentalZonelessChangeDetection,
  Provider,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptors, withInterceptorsFromDi } from "@angular/common/http";
import { AppInitService } from 'src/environments/app.init.service';
import { KeycloakAngularModule, KeycloakBearerInterceptor, KeycloakService } from 'keycloak-angular';
import { SettingsService } from 'src/environments/settings.service';
import { UserContextService } from './core/services/user-context.service';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { httpErrorInterceptor } from './core/interceptors/http-error.interceptor';


// Provider for Keycloak Bearer Interceptor
const keycloakBearerInterceptorProvider: Provider = {
  provide: HTTP_INTERCEPTORS,
  useClass: KeycloakBearerInterceptor,
  multi: true,
};


export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(),
    ),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptorsFromDi(), withInterceptors([httpErrorInterceptor])),
    KeycloakAngularModule,
    keycloakBearerInterceptorProvider,
    KeycloakService,
    BrowserAnimationsModule,
    importProvidersFrom(LoggerModule.forRoot({ level: NgxLoggerLevel.WARN })),
    // provideZoneChangeDetection()
    provideExperimentalZonelessChangeDetection(),
    {
      provide: APP_INITIALIZER,
      useFactory: appInit,
      deps: [AppInitService, KeycloakService, SettingsService, UserContextService],
      multi: true
    },
  ]
};

function appInit(appInitService: AppInitService): () => Promise<unknown> {
  return () => appInitService.initializeApp();
}