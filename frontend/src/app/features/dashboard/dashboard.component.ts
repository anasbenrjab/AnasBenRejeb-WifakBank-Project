import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService, DashboardData } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="dashboard">

      <!-- ── Header ── -->
      <header class="header">
        <div class="header-left">
          <div class="logo">
            <span class="logo-icon"></span>
            <span class="logo-text">WifakBank</span>
          </div>
          <span class="app-name">Dashboard Client</span>
        </div>
        <div class="header-right">
          <div class="user-badge">
            <div class="avatar">{{ userInitial() }}</div>
            <div class="user-info">
              <span class="user-name">{{ user()?.username }}</span>
              <span class="user-role">{{ primaryRole() }}</span>
            </div>
          </div>
          <button class="logout-btn" (click)="logout()" title="Sign out">
            <span>⏏</span> Sign Out
          </button>
        </div>
      </header>

      <!-- ── Main Content ── -->
      <main class="content">

        <!-- Welcome banner -->
        <div class="welcome-banner">
          <h1>{{ dashboardData()?.welcomeMessage ?? 'Welcome!' }}</h1>
          <p>You are authenticated via WifakBank SSO. Last login: <strong>{{ dashboardData()?.lastLogin | date:'medium' }}</strong></p>
        </div>

        <!-- Stats grid -->
        <section class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon"></div>
            <div class="stat-value">{{ dashboardData()?.totalApplications ?? '—' }}</div>
            <div class="stat-label">Connected Applications</div>
          </div>

          <div class="stat-card">
            <div class="stat-icon"></div>
            <div class="stat-value">{{ dashboardData()?.activeSessions ?? '—' }}</div>
            <div class="stat-label">Active Sessions</div>
          </div>

          <div class="stat-card">
            <div class="stat-icon"></div>
            <div class="stat-value">{{ user()?.roles?.length ?? 0 }}</div>
            <div class="stat-label">Assigned Roles</div>
          </div>
        </section>

        <!-- Roles section -->
        <section class="card roles-card">
          <h2 class="card-title">Your Roles &amp; Permissions</h2>
          <div class="role-tags">
            @for (role of user()?.roles; track role) {
              <span class="role-tag">{{ role }}</span>
            } @empty {
              <span class="no-roles">No roles assigned</span>
            }
          </div>
        </section>

        <!-- SSO info section -->
        <section class="card sso-card">
          <h2 class="card-title">SSO Session Info</h2>
          <div class="info-rows">
            <div class="info-row">
              <span class="info-key">Authentication Method</span>
              <span class="info-val badge badge-success">JWT SSO</span>
            </div>
            <div class="info-row">
              <span class="info-key">Source Application</span>
              <span class="info-val">WifakBankProject (port 4200)</span>
            </div>
            <div class="info-row">
              <span class="info-key">Session Storage</span>
              <span class="info-val badge badge-info">sessionStorage (tab-scoped)</span>
            </div>
            <div class="info-row">
              <span class="info-key">Token Validation</span>
              <span class="info-val badge badge-success">✓ Verified by backend (port 8082)</span>
            </div>
          </div>
        </section>

      </main>
    </div>
  `,
  styles: [`
    /* ── Layout ── */
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
      gap: 16px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 1.1rem;
    }

    .logo-icon { font-size: 1.4rem; }

    .app-name {
      padding: 3px 10px;
      background: rgba(255,255,255,0.15);
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
      letter-spacing: 0.5px;
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

    .user-name {
      font-weight: 600;
      font-size: 0.9rem;
    }

    .user-role {
      font-size: 0.75rem;
      opacity: 0.75;
    }

    .logout-btn {
      background: rgba(255,255,255,0.1);
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
      padding: 7px 16px;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s;
    }

    .logout-btn:hover {
      background: rgba(211, 47, 47, 0.8);
      border-color: transparent;
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

    /* ── Welcome Banner ── */
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

    .welcome-banner p {
      color: #757575;
      font-size: 0.9rem;
    }

    /* ── Stats Grid ── */
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

    .stat-icon { font-size: 2rem; margin-bottom: 10px; }

    .stat-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: #1a237e;
      line-height: 1;
    }

    .stat-label {
      color: #757575;
      font-size: 0.85rem;
      margin-top: 8px;
      font-weight: 500;
    }

    /* ── Generic Card ── */
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

    /* ── Role Tags ── */
    .role-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .role-tag {
      background: #e8eaf6;
      color: #1a237e;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      letter-spacing: 0.3px;
    }

    .no-roles {
      color: #9e9e9e;
      font-style: italic;
    }

    /* ── Info Rows ── */
    .info-rows {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .info-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #f5f5f5;
    }

    .info-row:last-child { border-bottom: none; }

    .info-key {
      font-size: 0.875rem;
      color: #616161;
      font-weight: 500;
    }

    .info-val {
      font-size: 0.875rem;
      font-weight: 500;
    }

    /* ── Badges ── */
    .badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .badge-success {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .badge-info {
      background: #e3f2fd;
      color: #1565c0;
    }

    /* ── Responsive ── */
    @media (max-width: 640px) {
      .header { padding: 0 16px; }
      .content { padding: 16px; }
      .user-info { display: none; }
      .app-name { display: none; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);

  user = this.authService.user;
  dashboardData = signal<DashboardData | null>(null);

  /** First letter of username for avatar */
  userInitial = () => (this.user()?.username?.[0] ?? 'U').toUpperCase();

  /** First role for display in header subtitle */
  primaryRole = () => this.user()?.roles?.[0] ?? 'User';

  ngOnInit(): void {
    this.dashboardService.getData().subscribe({
      next: (data) => this.dashboardData.set(data),
      error: (err) => console.error('Failed to load dashboard data:', err)
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
