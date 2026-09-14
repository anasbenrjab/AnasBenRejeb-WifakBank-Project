import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">

      <div class="login-card">

        

        <!-- Error banner -->
        @if (errorMessage()) {
          <div class="alert" role="alert">
            {{ errorMessage() }}
          </div>
        }

        <!-- Login form -->
        <form (ngSubmit)="onSubmit()" #loginForm="ngForm" novalidate>

          <div class="field">
            <label for="username">Nom d'utilisateur</label>
            <input
              id="username"
              type="text"
              name="username"
              [(ngModel)]="username"
              required
              autocomplete="username"
              placeholder="Entrez votre identifiant"
              [disabled]="isLoading()" />
          </div>

          <div class="field">
            <label for="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              name="password"
              [(ngModel)]="password"
              required
              autocomplete="current-password"
              placeholder="Entrez votre mot de passe"
              [disabled]="isLoading()" />
          </div>

          <button
            type="submit"
            class="submit-btn"
            [disabled]="isLoading() || !username || !password">
            @if (isLoading()) {
              <span class="btn-spinner"></span>
              Connexion en cours...
            } @else {
              Se connecter
            }
          </button>

        </form>

      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #1a237e 0%, #283593 60%, #3949ab 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      font-family: 'Inter', Arial, sans-serif;
    }

    .login-card {
      background: white;
      border-radius: 16px;
      padding: 48px 40px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    /* Brand */
    .brand {
      text-align: center;
      margin-bottom: 36px;
    }

    .brand-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 12px;
    }

    .brand-name {
      font-size: 1.8rem;
      font-weight: 700;
      color: #1a237e;
      margin: 0 0 4px;
    }

    .brand-sub {
      font-size: 0.9rem;
      color: #757575;
      margin: 0;
    }

    /* Error alert */
    .alert {
      background: #ffebee;
      color: #c62828;
      border: 1px solid #ef9a9a;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 0.875rem;
      margin-bottom: 20px;
      font-weight: 500;
    }

    /* Form fields */
    .field {
      margin-bottom: 20px;
    }

    .field label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: #424242;
      margin-bottom: 6px;
    }

    .field input {
      width: 100%;
      padding: 11px 14px;
      border: 1.5px solid #e0e0e0;
      border-radius: 8px;
      font-size: 0.95rem;
      font-family: 'Inter', Arial, sans-serif;
      color: #212121;
      background: #fafafa;
      transition: border-color 0.2s, box-shadow 0.2s;
      box-sizing: border-box;
    }

    .field input:focus {
      outline: none;
      border-color: #1a237e;
      background: white;
      box-shadow: 0 0 0 3px rgba(26, 35, 126, 0.1);
    }

    .field input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Submit button */
    .submit-btn {
      width: 100%;
      padding: 13px;
      background: linear-gradient(135deg, #1a237e, #283593);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      font-family: 'Inter', Arial, sans-serif;
      cursor: pointer;
      margin-top: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: opacity 0.2s, transform 0.1s;
    }

    .submit-btn:hover:not(:disabled) {
      opacity: 0.92;
      transform: translateY(-1px);
    }

    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    /* Spinner inside button */
    .btn-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 480px) {
      .login-card { padding: 36px 24px; }
    }
  `]
})
export class LoginComponent {
  private http      = inject(HttpClient);
  private router    = inject(Router);
  private authService = inject(AuthService);

  username    = '';
  password    = '';
  isLoading   = signal(false);
  errorMessage = signal('');

  onSubmit(): void {
    if (!this.username || !this.password) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    // POST to this app's own backend (8082) — validates against local USERS table
    this.http.post<{ token: string }>('http://localhost:8082/api/auth/login', {
      username: this.username,
      password: this.password
    }).subscribe({
      next: (response) => {
        // Store the token and validate — AuthService will navigate to /dashboard on success
        this.authService.setToken(response.token);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.status === 401) {
          this.errorMessage.set('Identifiant ou mot de passe incorrect.');
        } else if (err.status === 0) {
          this.errorMessage.set('Impossible de joindre le serveur. Vérifiez que le backend est démarré.');
        } else {
          this.errorMessage.set(`Erreur de connexion (${err.status}). Réessayez.`);
        }
      }
    });
  }
}
