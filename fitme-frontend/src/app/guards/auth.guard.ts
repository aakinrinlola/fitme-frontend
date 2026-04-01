import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

/**
 * Auth Guard — Dual-Mode:
 *
 * Local:  Synchroner Token-Check (wie bisher)
 * Auth0:  Async Auth0 isAuthenticated$ Check
 *         Bei nicht-eingeloggt: Redirect zu Auth0 Universal Login (nicht /login)
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isAuth0 = environment.auth?.mode === 'auth0';

  if (isAuth0) {
    // Auth0-Modus: Observable-basiert
    return auth.isAuthenticated$().pipe(
      take(1),
      map(isAuthenticated => {
        if (isAuthenticated) return true;
        // Nicht eingeloggt → Auth0 Login auslösen
        auth.login();
        return false;
      })
    );
  }

  // Local-Modus: Synchron
  return auth.isLoggedIn() ? true : router.createUrlTree(['/login']);
};

/**
 * Guest Guard — verhindert Zugriff auf Login/Register wenn eingeloggt.
 * Im Auth0-Modus: Login/Register-Seiten sind nicht nötig → immer zum Dashboard.
 */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isAuth0 = environment.auth?.mode === 'auth0';

  if (isAuth0) {
    // Auth0-Modus: Login/Register-Seiten nicht nötig → zum Dashboard
    return router.createUrlTree(['/dashboard']);
  }

  return !auth.isLoggedIn() ? true : router.createUrlTree(['/dashboard']);
};
