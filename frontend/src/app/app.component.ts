import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { IframeService } from './core/services/iframe.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <!-- router-outlet is always present — never conditionally removed from the DOM.
         Removing and re-adding the outlet is what causes DashboardComponent to be
         destroyed and recreated, stacking headers on each re-open from the portal.
         Instead we overlay a splash screen on top while initializing. -->
    <router-outlet />

    @if (!isInitialized()) {
      <div class="splash">
        <div class="spinner"></div>
        <p>Chargement...</p>
      </div>
    }
  `,
  styles: [`
    /* Splash overlays the router content while auth is initializing.
       position:fixed keeps it on top regardless of what the router has rendered. */
    .splash {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: #f0f2f5;
      gap: 16px;
      color: #1a237e;
      font-family: 'Inter', sans-serif;
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
  private iframeService = inject(IframeService);

  isInitialized = this.authService.isInitialized;

  ngOnInit(): void {
    this.iframeService.detect();

    const urlParams = new URLSearchParams(window.location.search);

    const returnUrl = urlParams.get('returnUrl');
    if (returnUrl) {
      sessionStorage.setItem('portalReturnUrl', returnUrl);
    }

    const token = urlParams.get('token');
    if (token) {
      window.history.replaceState({}, document.title, window.location.pathname);
      this.authService.setToken(token);
    }
  }
}
