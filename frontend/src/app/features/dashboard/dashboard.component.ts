import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { AppEntry } from '../../core/models/dashboard.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly router           = inject(Router);
  readonly auth                     = inject(AuthService);

  readonly apps         = signal<AppEntry[]>([]);
  readonly loading      = signal(true);
  readonly errorMessage = signal<string | null>(null);

  get user() { return this.auth.currentUser(); }

  ngOnInit(): void {
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

  openApp(url: string | undefined): void {
    if (url) {
      window.open(url, '_blank', 'noopener noreferrer');
    }
  }

  logout(): void {
    this.auth.logout();
  }
}
