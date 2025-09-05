import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.services';

export const authGuard: CanActivateFn = (_route, _state): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);
  auth.loadSession();
  if (!auth.isLoggedIn) return router.createUrlTree(['/login']);
  return true;
};
