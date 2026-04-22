import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { refreshTokenInterceptor } from './interceptors/refresh-token.interceptor';
import { httpErrorInterceptor } from './shared/interceptors/http-error.interceptor';
import { AuthService } from './services/auth.service';

function initAuth(authService: AuthService) {
  return () => {
    if (authService.isLoggedIn()) {
      authService.refreshCurrentUser();
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([httpErrorInterceptor, refreshTokenInterceptor, authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initAuth,
      deps: [AuthService],
      multi: true
    }
  ]
};