import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { AppEntry } from '../../core/models/dashboard.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly apps = signal<AppEntry[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  get user() { return this.auth.currentUser(); }

  ngOnInit(): void {
    // Redirect admin users to admin dashboard
    if (this.auth.isAdmin()) {
      this.router.navigate(['/admin/dashboard']);
      return;
    }

    this.dashboardService.getAuthorizedApps().subscribe({
      next: data => {
        this.apps.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Impossible de charger les applications. Veuillez réessayer.');
        this.loading.set(false);
      }
    });
  }

  openApp(id: number): void {
    this.router.navigate(['/dashboard/app', id]);
  }

  logout(): void {
    this.auth.logout();
  }
}
