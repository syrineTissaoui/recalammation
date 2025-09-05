import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login',    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },

  { path: 'agent', canActivate: [authGuard, roleGuard(['AGENT'])],
    loadComponent: () => import('./pages/agent-dashboard/agent-dashboard.component').then(m => m.AgentDashboardComponent) },
  { path: 'cadre', canActivate: [authGuard, roleGuard(['CADRE'])],
    loadComponent: () => import('./pages/cadre-dashboard/cadre-dashboard.component').then(m => m.CadreDashboardComponent) },

  { path: '**', redirectTo: 'login' }
];
