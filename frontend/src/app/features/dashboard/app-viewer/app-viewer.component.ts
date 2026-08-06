import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DashboardService } from '../../../core/services/dashboard.service';
import { AppEntry } from '../../../core/models/dashboard.models';

@Component({
  selector: 'app-app-viewer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app-viewer.component.html',
  styleUrl: './app-viewer.component.css'
})
export class AppViewerComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly dashboardService = inject(DashboardService);

  readonly app = signal<AppEntry | null>(null);
  readonly safeUrl = signal<SafeResourceUrl | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id || isNaN(id)) {
      this.errorMessage.set('Identifiant application invalide.');
      this.loading.set(false);
      return;
    }

    this.dashboardService.getAuthorizedApps().subscribe({
      next: apps => {
        const found = apps.find(a => a.id === id);
        if (!found) {
          this.errorMessage.set('Application introuvable ou accès non autorisé.');
          this.loading.set(false);
          return;
        }
        if (!found.url) {
          this.errorMessage.set(`L'application "${found.nom}" n'a pas d'URL configurée.`);
          this.app.set(found);
          this.loading.set(false);
          return;
        }
        this.app.set(found);
        // bypassSecurityTrustResourceUrl tells Angular's sanitizer this URL
        // is intentional. Note: this does NOT override the target server's
        // X-Frame-Options or frame-ancestors CSP headers — those are enforced
        // by the browser and must be configured on the intranet app servers.
        this.safeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(found.url));
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Impossible de charger l\'application.');
        this.loading.set(false);
      }
    });
  }

  back(): void {
    this.router.navigate(['/dashboard']);
  }
}
