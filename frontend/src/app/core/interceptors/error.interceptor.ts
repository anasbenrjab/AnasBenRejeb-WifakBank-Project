import { HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Catches HTTP 401 Unauthorized responses from the backend and triggers
 * an automatic logout + redirect to /login.
 *
 * This handles the case where a JWT has expired mid-session: the API rejects
 * the request with 401, and the user is cleanly redirected instead of seeing
 * a broken UI.
 *
 * Order matters: this interceptor must run AFTER jwtInterceptor (which attaches
 * the token) so that it can catch the backend's rejection of that token.
 * In app.config.ts, interceptors run in the order they are listed in the array.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError(err => {
      if (err.status === HttpStatusCode.Unauthorized) {
        // Token is missing, expired, or invalid — force logout
        auth.logout();
      }
      // Re-throw so individual components can still handle other errors
      return throwError(() => err);
    })
  );
};
