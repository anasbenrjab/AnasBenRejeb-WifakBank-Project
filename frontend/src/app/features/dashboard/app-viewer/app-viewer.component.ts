import { Component, OnInit, OnDestroy, inject, signal, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DashboardService } from '../../../core/services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';
import { AppEntry } from '../../../core/models/dashboard.models';

@Component({
  selector: 'app-app-viewer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app-viewer.component.html',
  styleUrl: './app-viewer.component.css'
})
export class AppViewerComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly dashboardService = inject(DashboardService);
  private readonly authService = inject(AuthService);
  private readonly zone = inject(NgZone);

  // Bound reference so we can remove the same listener in ngOnDestroy
  private readonly messageListener = (event: MessageEvent) => {
    // Only accept messages from the expected child app origins.
    // The child app sends { type: 'LOGOUT' } before calling window.location.href.
    if (event.data?.type === 'LOGOUT' || event.data?.type === 'PORTAL_RETURN') {
      this.zone.run(() => {
        this.app.set(null);
        this.safeUrl.set(null);
        this.router.navigate(['/dashboard']);
      });
    }
  };

  readonly app = signal<AppEntry | null>(null);
  readonly safeUrl = signal<SafeResourceUrl | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    // Listen for postMessage from the child app.
    // The child app should call:
    //   window.parent.postMessage({ type: 'LOGOUT' }, 'http://localhost:4200')
    // before its own window.location.href redirect.
    window.addEventListener('message', this.messageListener);
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
        // Build the iframe URL with two parameters:
        //   ?token=JWT       — authenticates the user in the child app
        //   &returnUrl=...   — tells the child app where to redirect on logout
        // The child app should store returnUrl in sessionStorage on init and
        // use it instead of its own /login route when the user signs out.
        const token = this.authService.getToken();
        const returnUrl = encodeURIComponent(`${window.location.origin}/dashboard`);
        const urlWithToken = token
          ? `${found.url}?token=${token}&returnUrl=${returnUrl}`
          : found.url;
        this.safeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(urlWithToken));
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Impossible de charger l\'application.');
        this.loading.set(false);
      }
    });
  }

  back(): void {
    // Clear the app signal before navigating so the viewer topbar
    // empties immediately rather than persisting during the route transition.
    this.app.set(null);
    this.safeUrl.set(null);
    this.router.navigate(['/dashboard']);
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.messageListener);
    this.app.set(null);
    this.safeUrl.set(null);
  }
}
