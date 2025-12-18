import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

// Interface define kar lete hain (Clean Code)
interface User {
  id: string;
  email: string;
  firstName: string;
  role: string;
}

interface AuthResponse {
  access_token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;;

  // ✅ 1. State (Signal): User abhi null hai
  // 'private' rakha taaki koi bahar se directly change na kar sake
  private currentUserSignal = signal<User | null>(null);

  // ✅ 2. Computed Signal: Sirf read karne ke liye public variable
  readonly currentUser = this.currentUserSignal.asReadonly();
  
  // ✅ 3. Helper Signal: Kya user login hai?
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());

  // Platform ID inject karein (Pata karne ke liye ki hum kahan hain)
  private platformId = inject(PLATFORM_ID);
  constructor() {
    // App start hote hi check karo ki localStorage mein token hai kya?
    // (Real app mein hum /profile API hit karke verify karenge, abhi simple rakhte hain)
    if(isPlatformBrowser(this.platformId)){
      const token = localStorage.getItem('token');
      if (token) {
        // Temporary: Assume user is logged in (Baad mein API se user fetch karenge)
        // this.currentUserSignal.set({ ...dummyUser }); 
      }
    }
  }

  login(credentials: any) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        // Token save karo
        if(isPlatformBrowser(this.platformId)) {
          localStorage.setItem('token', response.access_token);
        }
        // Signal update karo (UI apne aap update ho jayega)
        this.currentUserSignal.set(response.user);
      })
    );
  }

  signup(data: any) {
    // Backend API: POST /api/register
    // Note: Backend register hone par Token nahi deta (sirf User deta hai),
    // isliye hum token save nahi kar rahe. User ko login karna padega.
    return this.http.post<any>(`${this.apiUrl}/register`, data);
  }

  logout() {
    if(isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
    }
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }
}