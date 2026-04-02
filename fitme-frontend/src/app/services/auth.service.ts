import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, of } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AuthResponse, LoginRequest, RegisterRequest,
  RefreshTokenRequest, UserInfo
} from '../models/auth.model';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { User as Auth0User } from '@auth0/auth0-spa-js';

/**
 * Dual-Mode AuthService:
 *
 * mode='local'  → Eigene JWT-Auth (Login/Register über Backend-API)
 * mode='auth0'  → Auth0 Universal Login (SDK managed)
 *
 * Alle Komponenten nutzen diesen Service — der Modus ist transparent.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/api/auth`;
  private readonly ACCESS_TOKEN_KEY = 'fitme_access_token';
  private readonly REFRESH_TOKEN_KEY = 'fitme_refresh_token';
  private readonly USER_KEY = 'fitme_user';
  private readonly isAuth0 = environment.auth?.mode === 'auth0';

  private currentUserSubject = new BehaviorSubject<UserInfo | null>(
    this.isAuth0 ? null : this.loadStoredUser()
  );
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    @Optional() @Inject(Auth0Service) private auth0: Auth0Service | null,
  ) {
    // Auth0-Modus: User-Info aus Auth0 SDK synchronisieren
    if (this.isAuth0 && this.auth0) {
      this.auth0.user$.subscribe((auth0User: Auth0User | null | undefined) => {
        if (auth0User) {
          const userInfo: UserInfo = {
            id: 0,  // wird vom Backend über /api/users/me geladen
            username: auth0User.nickname ?? auth0User.name ?? '',
            email: auth0User.email ?? '',
            role: 'USER',
            fitnessLevel: 'BEGINNER',
            age: 0,
            weightKg: 0,
            heightCm: 0,
          };
          this.currentUserSubject.next(userInfo);
        } else {
          this.currentUserSubject.next(null);
        }
      });
    }
  }

  // ══════════════════════════════════════════════════════════════
  // PUBLIC API — identisch für beide Modi
  // ══════════════════════════════════════════════════════════════

  login(request?: LoginRequest): Observable<AuthResponse> {
    if (this.isAuth0 && this.auth0) {
      this.auth0.loginWithRedirect();
      return of({} as AuthResponse);
    }
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, request).pipe(
      tap(res => this.storeSession(res))
    );
  }

  register(request?: RegisterRequest): Observable<AuthResponse> {
    if (this.isAuth0 && this.auth0) {
      this.auth0.loginWithRedirect({
        authorizationParams: { screen_hint: 'signup' }
      });
      return of({} as AuthResponse);
    }
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, request).pipe(
      tap(res => this.storeSession(res))
    );
  }

  refresh(request: RefreshTokenRequest): Observable<AuthResponse> {
    if (this.isAuth0) {
      return of({} as AuthResponse);
    }
    return this.http.post<AuthResponse>(`${this.baseUrl}/refresh`, request).pipe(
      tap(res => this.storeSession(res))
    );
  }

  logout(): void {
    if (this.isAuth0 && this.auth0) {
      this.auth0.logout({
        logoutParams: {
          returnTo: typeof window !== 'undefined' ? window.location.origin : ''
        }
      });
      return;
    }
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    if (this.isAuth0 && this.auth0) {
      return this.currentUserSubject.value !== null;
    }
    const token = this.getAccessToken();
    if (!token) return false;
    if (this.isTokenExpired(token)) {
      this.logout();
      return false;
    }
    return true;
  }

  isAuthenticated$(): Observable<boolean> {
    if (this.isAuth0 && this.auth0) {
      return this.auth0.isAuthenticated$;
    }
    return of(this.isLoggedIn());
  }

  getAccessToken(): string | null {
    if (this.isAuth0) return null;
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    if (this.isAuth0) return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getCurrentUser(): UserInfo | null {
    return this.currentUserSubject.value;
  }

  // ══════════════════════════════════════════════════════════════
  // PRIVATE — Local JWT Mode
  // ══════════════════════════════════════════════════════════════

  private storeSession(res: AuthResponse): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, res.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, res.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
  }

  private loadStoredUser(): UserInfo | null {
    const stored = localStorage.getItem(this.USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return !payload.exp || Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }
}
