import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type Role = 'AGENT' | 'CADRE';
export interface SessionUser { id: string; name?: string; email?: string; role?: Role; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = 'http://localhost:4000/api';

  // keep some reactive state if you want to bind to it
  private _user = signal<SessionUser | null>(null);
  private _token = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  // --- API calls
  register(body: { name: string; email: string; password: string; role: Role }) {
    return this.http.post<{ token: string; user: SessionUser }>(`${this.base}/auth/register`, body);
  }

  login(email: string, password: string) {
    return this.http.post<{ token: string; user: SessionUser }>(`${this.base}/auth/login`, { email, password });
  }

  // --- Session helpers expected by your templates/guards
  loadSession(): void {
    if (typeof window === 'undefined') return; // SSR safety
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    this._token.set(t);
    try { this._user.set(u ? JSON.parse(u) : null); } catch { this._user.set(null); }
  }

  saveSession(resp: { token: string; user: SessionUser }): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('token', resp.token);
    localStorage.setItem('user', JSON.stringify(resp.user));
    this._token.set(resp.token);
    this._user.set(resp.user);
  }

  clearSession(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this._token.set(null);
    this._user.set(null);
  }

  logout(): void { this.clearSession(); }

  get isLoggedIn(): boolean {
    // read from signal if set; otherwise read once from localStorage
    const tok = this._token();
    if (tok != null) return true;
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('token');
  }

  get role(): Role | null {
    const u = this._user();
    if (u?.role) return u.role;
    if (typeof window === 'undefined') return null;
    try { return (JSON.parse(localStorage.getItem('user') || 'null') as SessionUser | null)?.role ?? null; }
    catch { return null; }
  }

  getUser(): SessionUser | null {
    const u = this._user();
    if (u) return u;
    if (typeof window === 'undefined') return null;
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  }

  get token(): string | null {
    const t = this._token();
    if (t) return t;
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }
}
