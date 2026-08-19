import { Component, OnInit, OnDestroy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <!-- Spinner shown until backend validation responds -->
    @if (!isInitialized()) {
      <div class="splash">
        <div class="spinner"></div>
        <p>Connecting to WifakBank Portal...</p>
      </div>
    }

    <!-- Brief "redirecting" message shown when validation failed -->
    @if (isInitialized() && !isAuthenticated()) {
      <div class="splash">
        <div class="lock-icon">🔒</div>
        <h2>Session Required</h2>
        <p>Redirecting to WifakBank Main Portal...</p>
      </div>
    }

    <!-- Dashboard renders here once authenticated -->
    @if (isInitialized() && isAuthenticated()) {
      <router-outlet />
    }
  `,
  styles: [`
    .splash {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: #f0f2f5;
      gap: 16px;
      color: #1a237e;
      font-family: 'Inter', sans-serif;
    }

    .lock-icon { font-size: 48px; }

    .splash h2 {
      font-size: 1.5rem;
      font-weight: 600;
    }

    .splash p {
      color: #757575;
      font-size: 0.95rem;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #e8eaf6;
      border-top-color: #1a237e;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);

  isAuthenticated = this.authService.isAuthenticated;
  isInitialized = this.authService.isInitialized;

  ngOnInit(): void {
    // Extract token from URL query param set by the main WifakBankProject portal
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      // Remove token from URL immediately so it doesn't sit in browser history
      window.history.replaceState({}, document.title, window.location.pathname);
      // Store token and kick off backend validation — isInitialized flips to true
      // only once the HTTP response (success or error) returns
      this.authService.setToken(token);
    }
    // If no token in URL and no token in sessionStorage, AuthService constructor
    // already set isInitialized = true, so the guard/redirect resolves instantly.
  }
}
