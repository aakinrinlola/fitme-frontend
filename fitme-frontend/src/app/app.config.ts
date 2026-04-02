import { ApplicationConfig, provideZoneChangeDetection, EnvironmentProviders } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAuth0, authHttpInterceptorFn } from '@auth0/auth0-angular';

import { routes } from './app.routes';
import { jwtInterceptor } from './interceptors/jwt.interceptor';
import { environment } from '../environments/environment';

const isAuth0 = environment.auth?.mode === 'auth0';

const httpInterceptors = isAuth0
  ? [authHttpInterceptorFn]
  : [jwtInterceptor];

// EnvironmentProviders[] statt Provider[] — provideAuth0() gibt EnvironmentProviders zurück
const auth0Providers: EnvironmentProviders[] = isAuth0
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
