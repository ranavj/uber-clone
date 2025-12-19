import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { isPlatformBrowser } from '@angular/common'; 

@Injectable({
  providedIn: 'root'
})
export class Auth { 
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  
  // 👇 2. Platform ID inject karein
  private platformId = inject(PLATFORM_ID);

  currentUser = signal<any>(null);

  constructor() {
    // 👇 3. Check karein: Kya hum Browser mein hain?
    if (isPlatformBrowser(this.platformId)) {
      const user = localStorage.getItem('uber_user');
      if (user) {
        this.currentUser.set(JSON.parse(user));
      }
    }
  }

  signup(userData: any) {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any) {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        if (response.user) {
          this.currentUser.set(response.user);
          
          // 👇 4. Yahan bhi check lagayein (Safety ke liye)
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
    
    // 👇 5. Yahan bhi check lagayein
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('uber_user');
      localStorage.removeItem('uber_token');
    }
  }
}