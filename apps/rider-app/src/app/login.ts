import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'; // ✅ Strict Forms
import { finalize } from 'rxjs/operators'; // ✅ Import finalize

// UI & Services
import { UiInput, UiButton, UiCardComponent } from '@uber/ui';
import { Auth, AuthResponse } from './services/auth';
import { HotToastService } from '@ngneat/hot-toast'; // ✅ Better Alerts

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiButton, UiInput, UiCardComponent, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Login {
  private fb = inject(NonNullableFormBuilder); // Strict Type
  private router = inject(Router);
  private authService = inject(Auth);
  private toast = inject(HotToastService);

  isLoading = signal(false);
  
  //  Strict Form Definition
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched(); //  Errors dikhane ke liye
      return;
    }

    this.isLoading.set(true);

    // ✅ Value access karne ka safe tareeka
    const credentials = this.loginForm.getRawValue();

    this.authService.login(credentials)
      .pipe(
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response: AuthResponse) => {
          console.log('✅ Login Success');
          
          this.toast.success('Welcome back!', {
             style: { border: '1px solid #22c55e', color: '#14532d' }
          });
          
          this.router.navigate(['/']);
        },
        error: (err) => {
          console.error('Login Failed', err);
          // Specific error message backend se, ya default
          const msg = err.error?.message || 'Invalid email or password';
          this.toast.error(msg);
        }
      });
  }
}