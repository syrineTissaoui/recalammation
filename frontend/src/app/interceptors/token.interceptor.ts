// src/app/interceptors/token.interceptor.ts (Angular 19)
import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const isAuthEndpoint =
    req.url.includes('/api/auth/login') || req.url.includes('/api/auth/register');

  if (isAuthEndpoint) {
    // Pas d'en-tête Authorization sur ces endpoints
    return next(req);
  }

  const token = localStorage.getItem('token');
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
