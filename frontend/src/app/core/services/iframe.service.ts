import { Injectable, signal } from '@angular/core';

/**
 * Detects whether the app is running inside an iframe (embedded in the main portal).
 * Used to conditionally hide navigation elements that duplicate the host portal's UI.
 */
@Injectable({ providedIn: 'root' })
export class IframeService {
  private _isInIframe = signal<boolean>(false);

  /** Readonly signal — true when window !== window.parent (i.e. inside an iframe) */
  readonly isInIframe = this._isInIframe.asReadonly();

  detect(): void {
    try {
      // Accessing window.parent can throw in sandboxed iframes — guard it
      const inIframe = window !== window.parent;
      this._isInIframe.set(inIframe);

      if (inIframe) {
        document.body.classList.add('in-iframe');
      } else {
        document.body.classList.remove('in-iframe');
      }
    } catch {
      // If same-origin check is blocked by sandbox policy, assume we're in an iframe
      this._isInIframe.set(true);
      document.body.classList.add('in-iframe');
    }
  }
}
