import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UiInput, UiButton, UiCardComponent } from '@uber/ui';
import { Auth } from './auth/auth';
@Component({
  selector: 'app-login',
  imports: [CommonModule,ReactiveFormsModule, UiButton, UiInput, UiCardComponent, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  // ✅ 1. Dependency Injection (The Modern Way)
  // Ab constructor mein likhne ki zaroorat nahi. Seedha field banake inject karo.
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(Auth);
  // ✅ 2. UI State via Signals
  isLoading = signal(false);
  errorMessage = signal('');

  // ✅ 3. Form Initialization
  // Kyunki 'this.fb' upar define ho chuka hai, hum form ko yahin initialize kar sakte hain!
  // Constructor ki zaroorat hi khatam.
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    // ✅ Clean Call: Ab logic service mein hai
    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading.set(false);
        // Abhi ke liye alert, baad mein Dashboard par bhejenge
        alert('Login Successful! State Updated.');
      },
      error: (err) => {
        this.errorMessage.set(err.error.message || 'Login failed');
        this.isLoading.set(false);
      }
    });
  }
}
