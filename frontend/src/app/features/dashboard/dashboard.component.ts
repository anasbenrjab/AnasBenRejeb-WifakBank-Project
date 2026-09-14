import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService, DashboardData } from '../../core/services/dashboard.service';
import { IframeService } from '../../core/services/iframe.service';

interface AppCard {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  url: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="dashboard">

      <!-- ── Header (hidden via CSS when body.in-iframe is set) ── -->
      <header class="header">
        <div class="header-left">
          <div class="logo">
            <span class="logo-icon"></span>
            <span class="logo-text">WifakBank</span>
          </div>
          <span class="app-badge">Dashboard Client</span>
        </div>
        <div class="header-right">
          <div class="user-badge">
            <div class="avatar">{{ userInitial() }}</div>
            <div class="user-info">
              <span class="user-name">{{ user()?.username }}</span>
              <span class="user-role">{{ primaryRole() }}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- ── Déconnexion — outside the header, always visible ── -->
      <div class="logout-bar">
        <button class="logout-btn" (click)="logout()" title="Déconnexion">
          <span aria-hidden="true">⏏</span> Déconnexion
        </button>
      </div>

      <!-- ── Main content — always visible ── -->
      <main class="content">

        <!-- Welcome banner -->
        <div class="welcome-banner">
          <h1>{{ dashboardData()?.welcomeMessage ?? 'Bienvenue!' }}</h1>
          <p>
            Authentifié via WifakBank SSO.
            Dernière connexion :
            <strong>{{ dashboardData()?.lastLogin | date:'medium' }}</strong>
          </p>
        </div>

        <!-- Stats row -->
        <section class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon"></div>
            <div class="stat-value">{{ dashboardData()?.totalApplications ?? '—' }}</div>
            <div class="stat-label">Applications connectées</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon"></div>
            <div class="stat-value">{{ dashboardData()?.activeSessions ?? '—' }}</div>
            <div class="stat-label">Sessions actives</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon"></div>
            <div class="stat-value">{{ user()?.roles?.length ?? 0 }}</div>
            <div class="stat-label">Rôles attribués</div>
          </div>
        </section>

         

        <!-- Roles -->
        <section class="card">
          <h2 class="card-title">Vos Rôles &amp; Permissions</h2>
          <div class="role-tags">
            @for (role of user()?.roles; track role) {
              <span class="role-tag">{{ role }}</span>
            } @empty {
              <span class="no-roles">Aucun rôle assigné</span>
            }
          </div>
        </section>

        <!-- SSO Info -->
        <section class="card">
          <h2 class="card-title">Informations de session SSO</h2>
          <div class="info-rows">
            <div class="info-row">
              <span class="info-key">Méthode d'authentification</span>
              <span class="info-val badge badge-success">JWT SSO</span>
            </div>
            <div class="info-row">
              <span class="info-key">Application source</span>
              <span class="info-val">WifakBankProject (port 4200)</span>
            </div>
            <div class="info-row">
              <span class="info-key">Stockage de session</span>
              <span class="info-val badge badge-info">sessionStorage (onglet uniquement)</span>
            </div>
            <div class="info-row">
              <span class="info-key">Validation du token</span>
              <span class="info-val badge badge-success">✓ Vérifié par le backend (port 8082)</span>
            </div>
          </div>
        </section>

      </main>
    </div>
  `,
  styles: [`
    .dashboard {
      min-height: 100vh;
      background: #f0f2f5;
      font-family: 'Inter', Arial, sans-serif;
      color: #212121;
    }

    /* ── Header ── */
    .header {
      background: linear-gradient(135deg, #1a237e 0%, #283593 100%);
      color: white;
      padding: 0 32px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 1.1rem;
    }

    .logo-icon { font-size: 1.4rem; }

    .app-badge {
      padding: 3px 10px;
      background: rgba(255,255,255,0.15);
      border-radius: 12px;
      font-size: 0.78rem;
      font-weight: 500;
      letter-spacing: 0.4px;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .user-badge {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255,255,255,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
      text-transform: uppercase;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }

    .user-name  { font-weight: 600; font-size: 0.9rem; }
    .user-role  { font-size: 0.75rem; opacity: 0.75; }

    /* ── Déconnexion bar — always rendered, sits right below header ── */
    .logout-bar {
      display: flex;
      justify-content: flex-end;
      padding: 8px 32px;
      background: #fff;
      border-bottom: 1px solid #e8eaf6;
    }

    .logout-btn {
      background: transparent;
      color: #1a237e;
      border: 1px solid #1a237e;
      padding: 6px 16px;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s, color 0.2s;
    }

    .logout-btn:hover {
      background: #d32f2f;
      color: white;
      border-color: #d32f2f;
    }

    /* ── Content ── */
    .content {
      padding: 32px;
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* ── Welcome banner ── */
    .welcome-banner {
      background: white;
      border-left: 5px solid #1a237e;
      padding: 24px 28px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .welcome-banner h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a237e;
      margin-bottom: 6px;
    }

    .welcome-banner p { color: #757575; font-size: 0.9rem; }

    /* ── Stats ── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .stat-card {
      background: white;
      padding: 28px 24px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: transform 0.15s, box-shadow 0.15s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    }

    .stat-icon  { font-size: 2rem; margin-bottom: 10px; }
    .stat-value { font-size: 2.5rem; font-weight: 700; color: #1a237e; line-height: 1; }
    .stat-label { color: #757575; font-size: 0.85rem; margin-top: 8px; font-weight: 500; }

    /* ── App cards ── */
    .apps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 16px;
    }

    .app-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 24px 16px;
      background: white;
      border: 2px solid transparent;
      border-radius: 12px;
      cursor: pointer;
      font-family: 'Inter', Arial, sans-serif;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
      text-align: center;
    }

    .app-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.13);
      border-color: var(--card-color, #1a237e);
    }

    .app-card:focus-visible {
      outline: 3px solid var(--card-color, #1a237e);
      outline-offset: 2px;
    }

    .app-card__icon {
      font-size: 2rem;
      width: 52px;
      height: 52px;
      border-radius: 12px;
      background: color-mix(in srgb, var(--card-color, #1a237e) 12%, white);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .app-card__label { font-size: 0.9rem; font-weight: 700; color: #212121; }
    .app-card__desc  { font-size: 0.75rem; color: #757575; line-height: 1.3; }

    /* ── Generic card ── */
    .card {
      background: white;
      padding: 28px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .card-title {
      font-size: 1rem;
      font-weight: 600;
      color: #1a237e;
      margin-bottom: 18px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e8eaf6;
    }

    /* ── Roles ── */
    .role-tags { display: flex; flex-wrap: wrap; gap: 10px; }

    .role-tag {
      background: #e8eaf6;
      color: #1a237e;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .no-roles { color: #9e9e9e; font-style: italic; }

    /* ── Info rows ── */
    .info-rows { display: flex; flex-direction: column; }

    .info-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #f5f5f5;
    }

    .info-row:last-child { border-bottom: none; }
    .info-key { font-size: 0.875rem; color: #616161; font-weight: 500; }
    .info-val { font-size: 0.875rem; font-weight: 500; }

    /* ── Badges ── */
    .badge { padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; }
    .badge-success { background: #e8f5e9; color: #2e7d32; }
    .badge-info    { background: #e3f2fd; color: #1565c0; }

    /* ── Responsive ── */
    @media (max-width: 640px) {
      .header      { padding: 0 16px; }
      .logout-bar  { padding: 8px 16px; }
      .content     { padding: 16px; }
      .user-info, .app-badge { display: none; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private authService    = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private iframeService  = inject(IframeService);

  user          = this.authService.user;
  dashboardData = signal<DashboardData | null>(null);
  isInIframe    = this.iframeService.isInIframe;   // kept for potential future use

  userInitial  = () => (this.user()?.username?.[0] ?? 'U').toUpperCase();
  primaryRole  = () => this.user()?.roles?.[0] ?? 'Utilisateur';

  readonly appCards: AppCard[] = [
    { id: 'ged',    label: 'GED',    icon: '📁', color: '#1565c0', description: 'Gestion électronique des documents', url: 'http://localhost:4202' },
    { id: 'crm',    label: 'CRM',    icon: '🤝', color: '#2e7d32', description: 'Gestion de la relation client',       url: 'http://localhost:4203' },
    { id: 'credit', label: 'Crédit', icon: '💳', color: '#e65100', description: 'Suivi et gestion des crédits',        url: 'http://localhost:4204' },
    { id: 'test',   label: 'TEST',   icon: '🧪', color: '#6a1b9a', description: 'Environnement de test',               url: 'http://localhost:4205' },
    { id: 'one',    label: 'ONE',    icon: '⭐', color: '#c62828', description: 'Application principale',              url: 'http://localhost:4206' }
  ];

  ngOnInit(): void {
    this.dashboardService.getData().subscribe({
      next: (data) => this.dashboardData.set(data),
      error: (err)  => console.error('Échec du chargement des données :', err)
    });
  }

  openApp(app: AppCard): void {
    const token = this.authService.getToken();
    window.open(`${app.url}?token=${token}`, '_blank');
  }

  logout(): void {
    this.authService.logout();
  }
}
