import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../auth/auth';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UiButton, UiCardComponent, UiInput } from '@uber/ui';

@Component({
  selector: 'app-signup',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, UiButton, UiInput, UiCardComponent],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  private fb = inject(FormBuilder);
  private authService = inject(Auth);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal('');

  // Bada Form
  signupForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['rider'] // Hidden field, default 'rider'
  });

  onSubmit() {
    if (this.signupForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.signup(this.signupForm.value).subscribe({
      next: () => {
        this.isLoading.set(false);
        alert('Account Created! Please Login.');
        this.router.navigate(['/']); // Login page par bhejo
      },
      error: (err) => {
        // Agar 409 Conflict aaya (Email exists), wo yahan dikhega
        this.errorMessage.set(err.error.message || 'Signup failed');
        this.isLoading.set(false);
      }
    });
  }
}
