import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.services';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
  <div class="bg-[#3B6CF0] min-h-screen flex items-center justify-center p-4">
    <div class="relative max-w-md w-full">
      <!-- Close/go to register (optional) -->
      <button aria-label="Close" class="absolute top-2 right-2 text-white text-xl leading-none focus:outline-none"
              (click)="goRegister()">
        ×
      </button>

      <h1 class="text-white font-extrabold text-xl sm:text-2xl text-center mb-1">
        Sign in
      </h1>

      <p class="text-white text-xs sm:text-sm text-center mb-6 font-normal">
        Welcome back! Please enter your details to continue.
      </p>

      <form class="space-y-4" (ngSubmit)="onLogin()" #f="ngForm">
        <!-- Email -->
        <label class="block text-white text-xs sm:text-sm font-normal mb-1 text-center" for="email">
          Enter your email address *
        </label>

        <div class="relative">
          <input
            id="email"
            name="email"
            required
            [(ngModel)]="email"
            type="email"
            placeholder="Ex. yourname@company.com"
            class="w-full rounded-md py-2 pl-10 pr-3 text-sm sm:text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <span class="absolute left-3 top-2.5 text-gray-400 pointer-events-none">
            <i class="fas fa-envelope"></i>
          </span>
        </div>

        <!-- Password -->
        <label class="block text-white text-xs sm:text-sm font-normal mb-1 text-center" for="password">
          Your password *
        </label>

        <div class="relative">
          <input
            id="password"
            name="password"
            required
            [(ngModel)]="password"
            [type]="showPw ? 'text' : 'password'"
            placeholder="••••••••"
            class="w-full rounded-md py-2 pl-10 pr-10 text-sm sm:text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <span class="absolute left-3 top-2.5 text-gray-400 pointer-events-none">
            <i class="fas fa-lock"></i>
          </span>
          <button type="button" class="absolute right-2 top-2.5 text-gray-100/90"
                  (click)="showPw = !showPw" aria-label="toggle password">
            <i class="fas" [class.fa-eye]="!showPw" [class.fa-eye-slash]="showPw"></i>
          </button>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          [disabled]="f.invalid || loading"
          class="w-full bg-[#2DB45A] text-white font-extrabold text-sm sm:text-base py-2 rounded-md
                 hover:bg-[#28a34a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <!-- Link to register -->
      <div class="text-center mt-3">
        <a routerLink="/register" class="text-white/90 underline text-sm">New here? Create an account</a>
      </div>

      
    </div>
  </div>
  `,
})
export class LoginComponent {
  email = '';
  password = '';
  showPw = false;
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  goRegister() { this.router.navigate(['/register']); }

  onLogin() {
    if (!this.email || !this.password) {
      alert('Please fill email and password');
      return;
    }
    this.loading = true;
    this.auth.login(this.email, this.password).subscribe({
      next: (resp) => {
        this.auth.saveSession(resp);
        this.loading = false;
        this.router.navigate([resp.user.role === 'CADRE' ? '/cadre' : '/agent']);
      },
      error: (e) => {
        this.loading = false;
        alert(e?.error?.message || 'Invalid credentials');
      }
    });
  }
}
