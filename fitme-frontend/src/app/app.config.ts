import { ApplicationConfig, provideZoneChangeDetection, Provider } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAuth0, authHttpInterceptorFn } from '@auth0/auth0-angular';

import { routes } from './app.routes';
import { jwtInterceptor } from './interceptors/jwt.interceptor';
import { environment } from '../environments/environment';

/**
 * Dual-Mode Auth:
 *
 * mode='local'  → Eigene Login/Register-Seiten + jwtInterceptor (dev)
 * mode='auth0'  → Auth0 Universal Login + authHttpInterceptorFn (prod)
 *
 * WICHTIG: `npm install @auth0/auth0-angular` muss installiert sein!
 */
const isAuth0 = environment.auth?.mode === 'auth0';

// Interceptor je nach Modus
const httpInterceptors = isAuth0
  ? [authHttpInterceptorFn]   // Auth0 hängt das Token automatisch an
  : [jwtInterceptor];          // Eigener JWT-Interceptor für lokale Auth

// Auth0 Provider (nur wenn auth0-Modus aktiv)
const auth0Providers: Provider[] = isAuth0
  ? [
    provideAuth0({
      domain: environment.auth.auth0Domain,
      clientId: environment.auth.auth0ClientId,
      authorizationParams: {
        redirect_uri: typeof window !== 'undefined' ? window.location.origin : '',
        audience: environment.auth.auth0Audience,
        scope: 'openid profile email',
      },
      httpInterceptor: {
        allowedList: [
          { uri: `${environment.apiUrl}/api/*` },
        ],
      },
    }),
  ]
  : [];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors(httpInterceptors)),
    ...auth0Providers,
  ]
};
