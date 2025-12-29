import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs'; // ✅ RxJS to Promise

// UI & Services
import { UiInput, UiButton, UiCardComponent } from '@uber/ui';
import { Auth, AuthResponse } from './services/auth';
import { toast } from 'ngx-sonner'; // ✅ Sonner Import

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiButton, UiInput, UiCardComponent, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Login {
  private fb = inject(NonNullableFormBuilder);
  private router = inject(Router);
  private authService = inject(Auth);

  isLoading = signal(false);

  // Strict Form Definition
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const credentials = this.loginForm.getRawValue();

    // 🎯 Sonner Promise: Loading, Success aur Error handle karega
    toast.promise(this.handleLoginRequest(credentials), {
      loading: 'Signing you in...',
      success: (data: AuthResponse) => {
        this.router.navigate(['/']);
        return 'Welcome back!';
      },
      error: (err:any) => {
        this.isLoading.set(false);
        return err.error?.message || 'Invalid email or password';
      }
    });
  }

  // 🎯 API Call Logic helper
  private async handleLoginRequest(credentials: any) {
    try {
      // Observable ko Promise mein badla Sonner ke liye
      const response = await firstValueFrom(this.authService.login(credentials));
      this.isLoading.set(false);
      return response;
    } catch (error) {
      this.isLoading.set(false);
      throw error; // Throw karna zaroori hai taaki toast.promise error state pakad sake
    }
  }
}