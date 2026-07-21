import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { LoginRequest, LoginResponse, UserSummary, UserDto } from '../models/auth.models';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'wifak_token';
const USER_KEY = 'wifak_user';
const API_URL = `${environment.apiUrl}/api/auth`;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // ── signals ───────────────────────────────────────────────────────────────
  private readonly _token = signal<string | null>(
    localStorage.getItem(TOKEN_KEY)
  );
  private readonly _user = signal<UserSummary | null>(
    AuthService.parseUser(localStorage.getItem(USER_KEY))
  );

  /** Read-only public signals */
  readonly token = this._token.asReadonly();
  readonly currentUser = this._user.asReadonly();
  /** True only if a token exists AND it has not expired. */
  readonly isLoggedIn = computed(() => {
    const t = this._token();
    return t !== null && !AuthService.isTokenExpired(t);
  });
  readonly isAdmin = computed(() => {
    const user = this._user();
    return user?.admin === true;
  });

  // ── public API ────────────────────────────────────────────────────────────

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_URL}/login`, credentials).pipe(
      tap(res => {
        if (!res.otpRequired && res.token) {
          this.persistSession(res);
        }
      })
    );
  }

  verifyOtp(login: string, code: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_URL}/verify-otp`, { login, code }).pipe(
      tap(res => {
        if (res.token) {
          this.persistSession(res);
        }
      })
    );
  }

  resendOtp(login: string): Observable<void> {
    return this.http.post<void>(`${API_URL}/resend-otp`, { login });
  }

  getCurrentUserProfile(): Observable<UserDto> {
    return this.http.get<UserDto>(`${API_URL}/me`);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this._token();
  }

  // ── private helpers ───────────────────────────────────────────────────────

  private persistSession(res: LoginResponse): void {
    if (!res.token) return;
    localStorage.setItem(TOKEN_KEY, res.token);
    const user: UserSummary = {
      login: res.login,
      nom: res.nom || '',
      prenom: res.prenom || '',
      email: res.email,
      admin: res.admin || false
    };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._token.set(res.token);
    this._user.set(user);
  }

  private static parseUser(raw: string | null): UserSummary | null {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserSummary;
    } catch {
      return null;
    }
  }

  /**
   * Decodes the JWT payload (base64url, no signature verification) and checks
   * whether the `exp` claim is in the past.
   * Returns true if the token is expired or malformed.
   */
  static isTokenExpired(token: string): boolean {
    try {
      // JWT structure: header.payload.signature — we only need the payload
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return true;

      // base64url → base64 → JSON
      const padded = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = atob(padded);
      const payload = JSON.parse(decoded) as { exp?: number };

      if (typeof payload.exp !== 'number') return false; // no expiry claim → treat as valid
      // exp is in seconds; Date.now() is in milliseconds
      return Date.now() >= payload.exp * 1000;
    } catch {
      // Malformed token → treat as expired
      return true;
    }
  }
}
