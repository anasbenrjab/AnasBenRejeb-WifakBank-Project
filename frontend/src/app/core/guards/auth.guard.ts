import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

/**
 * Protects /dashboard.
 *
 * - Waits for async token validation to complete before deciding.
 * - If authenticated → allow navigation.
 * - If NOT authenticated:
 *     Portal mode  (arrived via SSO ?token=) → the token already failed validation,
 *                                               so logout() will handle the redirect to portal.
 *     Standalone   (direct access, no token)  → redirect to /login within this app.
 */
export const authGuard: CanActivateFn = (_route, _state) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  return authService.waitForInitialization().pipe(
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true;
      }
      // Not authenticated — go to the login page inside this app
      return router.createUrlTree(['/login']);
    })
  );
};
