import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class RideService {
  private http = inject(HttpClient);
  
  // 👇 Backend URL (Auth service ka address + global prefix 'api')
  private apiUrl = `${environment.apiUrl}/rides`;
  private platformId = inject(PLATFORM_ID);
  requestRide(payload: any) {
    let headers = new HttpHeaders();

    // 🌍 Browser par Token nikalo aur Header mein daalo
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('uber_token');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }

    // 👇 Headers pass karo
    return this.http.post<any>(`${this.apiUrl}/request`, payload, { headers });
  }
}