import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UiButton, UiCardComponent, UiInput } from '@uber/ui';
import { Auth, AuthResponse } from '../services/auth';
import { User } from '@uber-clone/interfaces';

@Component({
  selector: 'app-signup',
  standalone: true,
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

  signupForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['rider'] // Default role
  });

  onSubmit() {
    if (this.signupForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.signup(this.signupForm.value).subscribe({
      next: (response: AuthResponse) => {
        this.isLoading.set(false);
        alert('Account Created! Please Login.');
        // ✅ Signup Success -> Go to Login Page
        this.router.navigate(['/login']); 
      },
      error: (err) => {
        // Agar email already exist karta hai (409 Conflict)
        this.errorMessage.set(err.error?.message || 'Signup failed. Try again.');
        this.isLoading.set(false);
      }
    });
  }
}