import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

/**
 * JWT-Interceptor — NUR im Local-Auth-Modus aktiv.
 * Im Auth0-Modus wird stattdessen authHttpInterceptorFn verwendet (siehe app.config.ts).
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getAccessToken();
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/api/auth/')) {
        const refreshToken = auth.getRefreshToken();
        if (refreshToken) {
          return auth.refresh({ refreshToken }).pipe(
            switchMap(res => {
              const retried = req.clone({
                setHeaders: { Authorization: `Bearer ${res.accessToken}` }
              });
              return next(retried);
            }),
            catchError(() => {
              auth.logout();
              router.navigate(['/login']);
              return throwError(() => err);
            })
          );
        }
        auth.logout();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
