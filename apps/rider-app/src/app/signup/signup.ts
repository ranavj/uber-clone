import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core'; // ✅ OnPush
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'; // ✅ Strict Forms
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs'; // ✅ Sonner promise integration ke liye

// UI & Services
import { UiButton, UiCardComponent, UiInput } from '@uber/ui';
import { Auth, AuthResponse } from '../services/auth';
import { toast } from 'ngx-sonner'; // ✅ Updated to Sonner

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, UiButton, UiInput, UiCardComponent],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
  changeDetection: ChangeDetectionStrategy.OnPush 
})
export class Signup {
  private fb = inject(NonNullableFormBuilder); 
  private authService = inject(Auth); 
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal('');

  // Strict Form Definition
  signupForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['rider'] 
  });

  async onSubmit() {
    // 1. Form Validation Check
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched(); 
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    const formData = this.signupForm.getRawValue();

    // 🎯 SONNER PROMISE: Signup, Redirect aur Error handling ek saath
    toast.promise(this.handleSignupRequest(formData), {
      loading: 'Creating your account...',
      success: (data: AuthResponse) => {
        // Redirect with a small delay
        setTimeout(() => this.router.navigate(['/login']), 1500);
        return 'Account Created! Redirecting...';
      },
      error: (err:any) => {
        const msg = err.error?.message || 'Signup failed. Try again.';
        this.errorMessage.set(msg);
        this.isLoading.set(false);
        return msg;
      }
    });
  }

  // ✅ Helper to wrap Observable in a Promise for Sonner
  private async handleSignupRequest(formData: any) {
    try {
      const response = await firstValueFrom(this.authService.signup(formData));
      this.isLoading.set(false);
      return response;
    } catch (error) {
      this.isLoading.set(false);
      throw error;
    }
  }
}