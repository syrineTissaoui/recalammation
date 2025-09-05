import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService, Role } from '../services/auth.services';

export const roleGuard =
  (allowed: Role | Role[]): CanActivateFn =>
  (_route, state): boolean | UrlTree => {
    const auth = inject(AuthService);
    const router = inject(Router);

    auth.loadSession(); // safe no-op on SSR

    const role = auth.role;
    const allowedArr = Array.isArray(allowed) ? allowed : [allowed];

    if (!auth.isLoggedIn || !role || !allowedArr.includes(role)) {
      // send to login and keep where we wanted to go
      return router.createUrlTree(['/login'], { queryParams: { redirectTo: state.url } });
    }
    return true;
  };
