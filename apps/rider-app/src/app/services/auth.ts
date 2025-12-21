import { Injectable, inject, signal, PLATFORM_ID, makeStateKey, TransferState } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Router } from '@angular/router';

// 🔑 TransferState Key
const USER_KEY = makeStateKey<any>('user_profile');

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;
  private platformId = inject(PLATFORM_ID);
  private transferState = inject(TransferState);

  currentUser = signal<any>(null);

  constructor() {
    this.initUser();
  }

  private initUser() {
    // PHASE A: TransferState Check (SSR se data aaya hai?)
    if (this.transferState.hasKey(USER_KEY)) {
      const user = this.transferState.get(USER_KEY, null);
      this.currentUser.set(user);
      this.transferState.remove(USER_KEY);
      console.log('🚀 Loaded User from TransferState (No API Call)');
      return;
    }

    // PHASE B: Browser Check (LocalStorage Token -> API Call)
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('uber_token');

      if (token) {
        console.log('🌍 Verifying Token with Backend...');

        this.fetchProfile().subscribe({
          next: (user) => {
            console.log('✅ Token Verified. User Set.');
            localStorage.setItem('uber_user', JSON.stringify(user));
          },
          error: () => {
            console.log('❌ Token Expired. Logging out.');
            this.logout();
          }
        });
      }
    }
  }

  fetchProfile() {
    // 1. Headers object banao
    let headers = {};

    // 2. Agar Browser par hain, toh LocalStorage se Token nikalo
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('uber_token');
      if (token) {
        // 3. Token ko Header mein chipkao
        headers = { 'Authorization': `Bearer ${token}` };
      }
    }

    // 4. Request ke saath Headers bhejo
    return this.http.get(`${this.apiUrl}/profile`, { headers }).pipe(
      tap((user: any) => {
        this.currentUser.set(user);

        if (isPlatformServer(this.platformId)) {
          this.transferState.set(USER_KEY, user);
        }
      })
    );
  }

  //  SIGNUP FUNCTION (Added Back) ✅
  signup(userData: any) {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  // Login Method
  login(credentials: any) {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
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

  // Guard Helper
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