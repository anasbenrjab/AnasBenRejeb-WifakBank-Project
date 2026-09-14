import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

export interface UserInfo {
  username: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'jwt_token';
  private readonly API_URL   = 'http://localhost:8082/api';

  private http   = inject(HttpClient);
  private router = inject(Router);

  private userSubject        = signal<UserInfo | null>(null);
  private initializedSubject = signal(false);

  public readonly user            = this.userSubject.asReadonly();
  public readonly isAuthenticated = computed(() => this.userSubject() !== null);
  public readonly isInitialized   = this.initializedSubject.asReadonly();

  constructor() {
    // If a ?token= is in the URL, AppComponent.ngOnInit handles validation.
    // If only a stored token exists (e.g. page refresh), validate it here.
    const hasUrlToken = new URLSearchParams(window.location.search).has('token');
    const storedToken = this.getToken();

    if (!hasUrlToken && storedToken) {
      this.validateWithBackend(storedToken);
    } else if (!hasUrlToken && !storedToken) {
      this.initializedSubject.set(true);
    }
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  /** Stores the token and validates it against the backend. */
  setToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
    this.validateWithBackend(token);
  }

  private validateWithBackend(token: string): void {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get<UserInfo>(`${this.API_URL}/auth/validate`, { headers }).subscribe({
      next: (userInfo) => {
        console.log('Auth validated for:', userInfo.username);
        this.userSubject.set(userInfo);
        this.initializedSubject.set(true);
        // Navigating to /dashboard when already there is a no-op in Angular's router
        // (same URL = no route deactivation/activation = no component destroy/recreate).
        // The <router-outlet> is now always in the DOM so there is no outlet teardown either.
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.warn('Token validation failed — status:', err.status, err.message);
        this.initializedSubject.set(true);
        this.logout();
      }
    });
  }

  waitForInitialization(): Observable<boolean> {
    return new Observable<boolean>(observer => {
      const check = () => {
        if (this.initializedSubject()) {
          observer.next(this.isAuthenticated());
          observer.complete();
        } else {
          setTimeout(check, 30);
        }
      };
      check();
    });
  }

  getDashboardData() {
    return this.http.get<any>(`${this.API_URL}/dashboard/data`);
  }

  logout(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    this.userSubject.set(null);

    const portalReturnUrl = sessionStorage.getItem('portalReturnUrl');
    sessionStorage.removeItem('portalReturnUrl');

    // If running inside the portal's iframe, notify the parent before redirecting.
    // The portal listens for this message to clear the active app name in its UI.
    const isInIframe = window !== window.parent;
    if (isInIframe) {
      try {
        window.parent.postMessage({ type: 'LOGOUT' }, 'http://localhost:4200');
      } catch (e) {
        console.warn('postMessage to parent failed:', e);
      }
      // Give the portal 100ms to process the message before we navigate away
      setTimeout(() => {
        window.location.href = portalReturnUrl ?? 'http://localhost:4200';
      }, 100);
    } else {
      // Standalone mode — redirect immediately to local login
      window.location.href = 'http://localhost:4201/login';
    }
  }
}
