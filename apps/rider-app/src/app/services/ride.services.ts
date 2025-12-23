import { Injectable, PLATFORM_ID, TransferState, inject, makeStateKey } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';

// ✅ Import Shared Interface
import { Ride } from '@uber-clone/interfaces';

// State Keys
const RIDE_TYPES_KEY = makeStateKey<any[]>('ride_types_config');
const LOCATION_KEY = makeStateKey<any>('user_ip_location');

@Injectable({
  providedIn: 'root'
})
export class RideService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private transferState = inject(TransferState);

  // 🌐 Dynamic API URL
  get apiUrl() {
    if (isPlatformServer(this.platformId)) {
      // Server Side (Docker/Internal)
      // Note: Hum '/api' tak return kar rahe hain, '/rides' method mein lagayenge
      return 'http://localhost:3002/api'; 
    }
    // Client Side
    return environment.rideApiUrl; // Expected: 'http://localhost:3002/api'
  }

  // 1. Get Ride Types (Moto, Auto, etc.)
  getRideTypes() {
    // Phase A: Check Tiffin (Client Side)
    if (this.transferState.hasKey(RIDE_TYPES_KEY)) {
      const data = this.transferState.get(RIDE_TYPES_KEY, []);
      this.transferState.remove(RIDE_TYPES_KEY);
      console.log('🏎️ Loaded Ride Config from TransferState');
      return of(data);
    }

    // Phase B: API Call
    // URL: /api/rides/types
    return this.http.get<any[]>(`${this.apiUrl}/rides/types`).pipe(
      tap(data => {
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(RIDE_TYPES_KEY, data);
        }
      })
    );
  }

  // 2. Request A Ride (Create Booking)
  // ✅ Payload 'any' ho sakta hai, par return type strictly 'Ride' hoga
  requestRide(payload: any): Observable<Ride> {
    
    // 🔐 AUTH HEADERS (Uncommented & Fixed)
    // Ab Backend par AuthGuard hai, toh Token bhejna zaroori hai
    let headers = new HttpHeaders();

    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('uber_token'); // Key match honi chahiye Auth service se
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }

    // URL: /api/rides/request
    // Hum headers pass kar rahe hain taaki 401 Error na aaye
    return this.http.post<Ride>(`${this.apiUrl}/rides/request`, payload, { headers });
  }

  // 3. Get Initial Location (SSR IP Detect)
  getInitialLocation() {
    if (this.transferState.hasKey(LOCATION_KEY)) {
      const data = this.transferState.get(LOCATION_KEY, null);
      this.transferState.remove(LOCATION_KEY);
      if (data) {
        console.log('📍 Loaded IP Location:', data.city);
        return of(data);
      }
    }

    // URL: /api/rides/location
    return this.http.get<any>(`${this.apiUrl}/rides/location`).pipe(
      tap(data => {
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(LOCATION_KEY, data);
        }
      })
    );
  }
}