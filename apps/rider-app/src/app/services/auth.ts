import { Injectable, inject, signal, PLATFORM_ID, makeStateKey, TransferState } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Router } from '@angular/router';
// ✅ Import Shared Interface
import { User } from '@uber-clone/interfaces';

// 🔑 TransferState Key
const USER_KEY = makeStateKey<User>('user_profile');

// 🛠️ Local Interface for API Response (Backend se yehi aata hai)
export interface AuthResponse {
  user: User;
  access_token: string;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private transferState = inject(TransferState);

  get apiUrl() {
    if (isPlatformServer(this.platformId)) return 'http://localhost:3002/api/auth';
    return environment.authApiUrl+'/auth';
  }

  // ✅ Signal ab strictly 'User' type ka hai
  currentUser = signal<User | null>(null);

  constructor() {
    this.initUser();
  }

  private initUser() {
    // PHASE A: TransferState
    if (this.transferState.hasKey(USER_KEY)) {
      const user = this.transferState.get(USER_KEY, null);
      if (user) {
        this.currentUser.set(user);
      }
      this.transferState.remove(USER_KEY);
      console.log('🚀 Loaded User from TransferState');
      return;
    }

    // PHASE B: Browser Check
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('uber_token');
      if (token) {
        console.log('🌍 Verifying Token...');
        this.fetchProfile().subscribe({
          next: (user) => {
            console.log('✅ Token Verified');
            localStorage.setItem('uber_user', JSON.stringify(user));
          },
          error: () => {
            console.log('❌ Token Expired');
            this.logout();
          }
        });
      }
    }
  }

  // ✅ FETCH PROFILE: Returns 'User'
  fetchProfile() {
    let headers = {};
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('uber_token');
      if (token) headers = { 'Authorization': `Bearer ${token}` };
    }

    // 👇 Generic <User> lagaya
    return this.http.get<User>(`${this.apiUrl}/profile`, { headers }).pipe(
      tap((user: User) => {
        this.currentUser.set(user);
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(USER_KEY, user);
        }
      })
    );
  }

  // ✅ SIGNUP: Returns 'AuthResponse' (Fixes "No overload matches" error)
  signup(userData: any) {
    // 👇 Yahan bataya ki response mein { user, access_token } aayega
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData);
  }

  // ✅ LOGIN: Returns 'AuthResponse'
  login(credentials: any) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: AuthResponse) => {
        if (response.access_token) {
          this.currentUser.set(response.user);
          
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('uber_user', JSON.stringify(response.user));
            localStorage.setItem('uber_token', response.access_token);
          }
        }
      })
    );
  }

  isAuthenticated(): boolean {
    if (this.currentUser()) return true;
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem('uber_token');
    }
    return true;
  }

  logout() {
    this.currentUser.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('uber_user');
      localStorage.removeItem('uber_token');
    }
    this.router.navigate(['/login']);
  }
}