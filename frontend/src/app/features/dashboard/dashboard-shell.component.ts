import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Minimal shell component for the /dashboard parent route.
 * Its sole purpose is to own the <router-outlet> that renders
 * DashboardComponent (/dashboard) and AppViewerComponent (/dashboard/app/:id).
 * Without this, both child routes share the root outlet and Angular cannot
 * properly destroy the previous component when navigating between them,
 * causing AppViewerComponent instances to stack in the DOM.
 */
@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />'
})
export class DashboardShellComponent {}
