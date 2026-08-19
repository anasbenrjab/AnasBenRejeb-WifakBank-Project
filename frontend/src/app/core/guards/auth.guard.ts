import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

/**
 * Functional route guard — waits for auth initialization to complete before
 * deciding whether to allow or block navigation.
 *
 * Returns an Observable so the router waits for async validation to finish
 * rather than checking the signal synchronously (which would always be false
 * on first load since the HTTP call hasn't returned yet).
 */
export const authGuard: CanActivateFn = (_route, _state) => {
  const authService = inject(AuthService);

  return authService.waitForInitialization().pipe(
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true;
      }
      // Validation failed or no token — send back to main portal
      window.location.href = 'http://localhost:4200/login';
      return false;
    })
  );
};
