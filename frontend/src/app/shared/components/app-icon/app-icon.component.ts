import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Renders an application icon consistently across admin and user dashboard.
 *
 * Usage:
 *   <app-icon [icon]="app.icon" [iconType]="app.iconType" size="lg" />
 *
 * iconType values:
 *   BOOTSTRAP_ICON (default) → <i class="bi bi-{icon}">
 *   URL / UPLOAD             → <img [src]="icon" [alt]="icon">
 *
 * Falls back to bi-app when icon is empty/null.
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (resolvedType === 'BOOTSTRAP_ICON') {
      <i
        class="bi"
        [class]="biClass"
        [ngClass]="sizeClass"
        aria-hidden="true"
      ></i>
    } @else {
      <img
        [src]="icon"
        [alt]="icon"
        [ngClass]="['app-icon-img', sizeClass]"
      />
    }
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; justify-content: center; }
    .app-icon-img { object-fit: contain; border-radius: 4px; }

    /* size variants */
    .icon-sm  { font-size: 1rem;   width: 1rem;   height: 1rem;   }
    .icon-md  { font-size: 1.5rem; width: 1.5rem; height: 1.5rem; }
    .icon-lg  { font-size: 2rem;   width: 2rem;   height: 2rem;   }
    .icon-xl  { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; }
  `]
})
export class AppIconComponent {
  /** Bootstrap Icons class name (without leading "bi-") or full class (e.g. "bi-folder"),
   *  or a URL / data URI when iconType is URL/UPLOAD. */
  @Input() icon: string | null | undefined = null;

  /** BOOTSTRAP_ICON | URL | UPLOAD. Defaults to BOOTSTRAP_ICON. */
  @Input() iconType: string | null | undefined = 'BOOTSTRAP_ICON';

  /** sm | md | lg | xl. Defaults to md. */
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';

  get resolvedType(): string {
    return this.iconType ?? 'BOOTSTRAP_ICON';
  }

  /** Full Bootstrap Icons CSS class string, e.g. "bi-folder" or "bi bi-folder". */
  get biClass(): string {
    const raw = (this.icon ?? '').trim();
    if (!raw) return 'bi-app';
    // Accept "bi-folder" or "folder" — always produce "bi-XXXX"
    return raw.startsWith('bi-') ? raw : `bi-${raw}`;
  }

  get sizeClass(): string {
    return `icon-${this.size}`;
  }
}
