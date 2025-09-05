import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.services';

type Role = 'AGENT' | 'CADRE';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
  <div class="bg-[#3B6CF0] min-h-screen flex items-center justify-center p-4">
    <div class="relative max-w-md w-full">
      <!-- Close button (optional) -->
      <button aria-label="Close" class="absolute top-2 right-2 text-white text-xl leading-none focus:outline-none"
              (click)="goLogin()">
        ×
      </button>

      <h1 class="text-white font-extrabold text-xl sm:text-2xl text-center mb-1">
        Register now
      </h1>

      

      <form class="space-y-4" (ngSubmit)="onRegister()" #f="ngForm">
        <!-- Name -->
        <label class="block text-white text-xs sm:text-sm font-normal mb-1 text-center" for="name">
          What's your name? *
        </label>

        <div class="relative">
          <input
            id="name"
            name="name"
            required
            [(ngModel)]="name"
            type="text"
            placeholder="Name"
            class="w-full rounded-md py-2 pl-10 pr-3 text-sm sm:text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <span class="absolute left-3 top-2.5 text-gray-100/90 pointer-events-none">
            <i class="fas fa-user"></i>
          </span>
        </div>

        <!-- Surname -->
        <div class="relative">
          <input
            id="surname"
            name="surname"
            required
            [(ngModel)]="surname"
            type="text"
            placeholder="Surname"
            class="w-full rounded-md py-2 pl-10 pr-3 text-sm sm:text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <span class="absolute left-3 top-2.5 text-gray-400 pointer-events-none">
            <i class="fas fa-user"></i>
          </span>
        </div>

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

        <!-- Password (added to match your backend) -->
        <label class="block text-white text-xs sm:text-sm font-normal mb-1 text-center" for="password">
          Create a password *
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

        <!-- Role (kept minimal, default AGENT) -->
        <div class="relative">
          <select
            id="role"
            name="role"
            [(ngModel)]="role"
            class="w-full rounded-md py-2 pl-10 pr-3 text-sm sm:text-base bg-white focus:outline-none focus:ring-2 focus:ring-white"
          >
            <option value="AGENT">AGENT</option>
            <option value="CADRE">CADRE</option>
          </select>
          <span class="absolute left-3 top-2.5 text-gray-400 pointer-events-none">
            <i class="fas fa-user-shield"></i>
          </span>
        </div>

        <button
          type="submit"
          [disabled]="f.invalid || loading"
          class="w-full bg-[#2DB45A] text-white font-extrabold text-sm sm:text-base py-2 rounded-md hover:bg-[#28a34a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Please wait…' : 'Create account' }}
        </button>
      </form>

      <!-- Decorative image like your mockup -->
     

     
    </div>
  </div>
  `,
  styles: [`
    :host { display:block; }
  `]
})
export class RegisterComponent {
  name = '';
  surname = '';
  email = '';
  password = '';
  role: Role = 'AGENT';
  showPw = false;
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  goLogin() { this.router.navigate(['/login']); }

  onRegister() {
    if (!this.name || !this.surname || !this.email || !this.password) {
      alert('Please fill all fields');
      return;
    }

    const fullName = `${this.name} ${this.surname}`.trim();

    this.loading = true;
    this.auth.register({
      name: fullName,
      email: this.email,
      password: this.password,
      role: this.role
    }).subscribe({
      next: () => {
        // auto-login
        this.auth.login(this.email, this.password).subscribe({
          next: (resp) => {
            this.auth.saveSession(resp);
            this.loading = false;
            this.router.navigate([resp.user.role === 'CADRE' ? '/cadre' : '/agent']);
          },
          error: (e) => {
            this.loading = false;
            alert(e?.error?.message || 'Login failed after register');
          }
        });
      },
      error: (e) => {
        this.loading = false;
        alert(e?.error?.message || 'Register failed');
      }
    });
  }
}
