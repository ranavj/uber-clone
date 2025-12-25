import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { User } from '@uber-clone/interfaces';

// ✅ Interfaces (Type Safety ke liye)
// interface User {
//   id: string;
//   email: string;
//   firstName: string;
//   role: string;
// }

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
  
  // Typo fixed (;; -> ;)
  private apiUrl = environment.authApiUrl; 

  // Platform ID for SSR check
  private platformId = inject(PLATFORM_ID);

  // ✅ 1. State (Signal)
  private currentUserSignal = signal<User | null>(null);

  // ✅ 2. Read-only Public API
  readonly currentUser = this.currentUserSignal.asReadonly();
  
  // ✅ 3. Helper: Kya user login hai?
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());

  constructor() {
    // ✅ PERMANENT FIX: App reload hone par User restore karo
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = localStorage.getItem('uber_user'); // User object string
      
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          this.currentUserSignal.set(parsedUser); // Signal restore kiya
          console.log('🔄 Session Restored:', parsedUser);
        } catch (e) {
          console.error('Session Parse Error', e);
          this.logout(); // Corrupt data ho toh logout kar do
        }
      }
    }
  }

  login(credentials: any) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        console.log('📦 Login API Response:', response);

        // ✅ Signal update (Sabse pehle)
        this.currentUserSignal.set(response.user);

        // ✅ Browser Storage update (SSR Safe)
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('uber_token', response.access_token);
          // User object bhi save karo taaki refresh par yaad rahe
          localStorage.setItem('uber_user', JSON.stringify(response.user)); 
        }
      })
    );
  }

  signup(data: any) {
    // Backend API: POST /api/register
    return this.http.post<any>(`${this.apiUrl}/register`, data);
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('uber_token');
      localStorage.removeItem('uber_user'); // User bhi clear karo
    }
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }
}