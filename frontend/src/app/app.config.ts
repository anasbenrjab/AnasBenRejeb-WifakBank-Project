import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    // Interceptors run left-to-right:
    //   1. jwtInterceptor  — attaches the Bearer token to outgoing requests
    //   2. errorInterceptor — catches 401 responses and triggers auto-logout
    provideHttpClient(withInterceptors([jwtInterceptor, errorInterceptor]))
  ]
};
