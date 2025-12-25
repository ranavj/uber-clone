import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core'; // ✅ OnPush
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'; // ✅ Strict Forms
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UiButton, UiCardComponent, UiInput } from '@uber/ui';
import { Auth, AuthResponse } from '../services/auth';
import { HotToastService } from '@ngneat/hot-toast'; // ✅ Better Alerts

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, UiButton, UiInput, UiCardComponent],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
  changeDetection: ChangeDetectionStrategy.OnPush 
})
export class Signup {
  // ✅ 1. Strict Form Builder (Typescript loves this)
  private fb = inject(NonNullableFormBuilder); 
  private authService = inject(Auth); 
  private router = inject(Router);
  private toast = inject(HotToastService); // ✅ Inject Toast

  isLoading = signal(false);
  errorMessage = signal('');

  // Ab is form ki values kabhi null nahi hongi
  signupForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['rider'] 
  });

  onSubmit() {
    // ✅ 2. Better UX: Agar form invalid hai, toh errors highlight karo
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched(); 
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    // ✅ 3. getRawValue() use karein (Strict Types ke liye)
    const formData = this.signupForm.getRawValue();

    this.authService.signup(formData).subscribe({
      next: (response: AuthResponse) => {
        this.isLoading.set(false);
        
        // ✅ 4. Modern Toast Notification
        this.toast.success('Account Created! Redirecting...', {
           style: { border: '1px solid #22c55e', background: '#f0fdf4', color: '#14532d' }
        });

        // Thoda delay taaki user Toast padh sake
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        const msg = err.error?.message || 'Signup failed. Try again.';
        this.errorMessage.set(msg);
        this.toast.error(msg); // Error ka bhi toast dikhao
        this.isLoading.set(false);
      }
    });
  }
}