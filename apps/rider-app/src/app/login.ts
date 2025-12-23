import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UiInput, UiButton, UiCardComponent } from '@uber/ui';
import { Auth, AuthResponse } from './services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiButton, UiInput, UiCardComponent, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(Auth); // 👈 Correct Service Name

  isLoading = signal(false);
  errorMessage = signal('');

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    if (this.loginForm.invalid) return;
    this.isLoading.set(true);

    this.authService.login(this.loginForm.value).subscribe({
      // ✅ Type Safe Response
      next: (response: AuthResponse) => {
        this.isLoading.set(false);
        console.log('✅ Login Success. Token:', response.access_token);
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Login Failed', err);
        this.isLoading.set(false);
        alert('Invalid Credentials');
      }
    });
  }
}