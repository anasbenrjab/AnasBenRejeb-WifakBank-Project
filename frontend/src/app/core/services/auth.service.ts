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

  // Direct URL — no proxy dependency, works regardless of angular.json builder config
  private readonly API_URL = 'http://localhost:8082/api';

  private http = inject(HttpClient);
  private router = inject(Router);

  private userSubject = signal<UserInfo | null>(null);
  private initializedSubject = signal(false);

  public readonly user = this.userSubject.asReadonly();
  public readonly isAuthenticated = computed(() => this.userSubject() !== null);
  public readonly isInitialized = this.initializedSubject.asReadonly();

  constructor() {
    // Only validate on startup if there's a stored token AND no ?token= in the URL.
    // AppComponent.ngOnInit handles the URL token case to avoid double-validation.
    const hasUrlToken = new URLSearchParams(window.location.search).has('token');
    const storedToken = this.getToken();

    if (!hasUrlToken && storedToken) {
      this.validateWithBackend(storedToken);
    } else if (!hasUrlToken && !storedToken) {
      // No token anywhere — done immediately
      this.initializedSubject.set(true);
    }
    // If hasUrlToken: AppComponent.ngOnInit will call setToken() which triggers validation
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  /** Called by AppComponent after stripping ?token= from the URL */
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
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.warn('Token validation failed — status:', err.status, err.message);
        this.initializedSubject.set(true);
        this.logout();
      }
    });
  }

  /**
   * Returns an Observable that waits until initialization is complete,
   * then emits whether the user is authenticated.
   * Used by authGuard so it never checks synchronously before the HTTP call returns.
   */
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
    window.location.href = 'http://localhost:4200/login';
  }
}
