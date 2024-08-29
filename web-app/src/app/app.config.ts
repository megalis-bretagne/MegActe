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
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { AppInitService } from 'src/environments/app.init.service';
import { KeycloakAngularModule, KeycloakBearerInterceptor, KeycloakService } from 'keycloak-angular';
import { SettingsService } from 'src/environments/settings.service';
import { UserContextService } from './services/user-context.service';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';

// Provider for Keycloak Bearer Interceptor
const KeycloakBearerInterceptorProvider: Provider = {
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
    provideHttpClient(withInterceptorsFromDi()),
    KeycloakAngularModule,
    KeycloakBearerInterceptorProvider,
    KeycloakService,
    KeycloakBearerInterceptorProvider,
    importProvidersFrom(LoggerModule.forRoot({ level: NgxLoggerLevel.WARN })),
    // provideZoneChangeDetection()
    provideExperimentalZonelessChangeDetection(),
    {
      provide: APP_INITIALIZER,
      useFactory: app_Init,
      deps: [AppInitService, KeycloakService, SettingsService, UserContextService],
      multi: true
    },
  ]
};

function app_Init(appInitService: AppInitService): () => Promise<any> {
  return () => appInitService.initializeApp();
}