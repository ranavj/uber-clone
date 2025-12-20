import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { isPlatformBrowser } from '@angular/common'; 
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class Auth { 
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl; // e.g., http://localhost:3000/api
  private platformId = inject(PLATFORM_ID);

  // User State Signal
  currentUser = signal<any>(null);

  constructor() {
    // 🔄 REFRESH HANDLER: App start hote hi check karo
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = localStorage.getItem('uber_user');
      const storedToken = localStorage.getItem('uber_token');

      if (storedUser && storedToken) {
        try {
          // Data wapas Signal mein daal do
          this.currentUser.set(JSON.parse(storedUser));
          console.log('✅ User Restored from Storage');
        } catch (e) {
          console.error('Error parsing user data', e);
          this.logout(); // Agar data corrupt hai toh logout karo
        }
      }
    }
  }

  // 👇 Helper Method for Guard (Bahut Zaroori Hai)
  isAuthenticated(): boolean {
    // 1. Pehle Signal check karo
    if (this.currentUser()) return true;

    // 2. Agar Signal null hai (Refresh case), toh LocalStorage check karo
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem('uber_token');
    }

    // Agar hum Server par hain (localStorage nahi hai), toh 'True' return karo.
    // Server ko redirect mat karne do. Client browser load hote hi asli checking karega.
    return true;  
  }

  signup(userData: any) {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any) {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        // Response structure: { access_token: '...', user: { ... } }
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

  logout() {
    this.currentUser.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('uber_user');
      localStorage.removeItem('uber_token');
    }
    this.router.navigate(['/login']);
  }
}