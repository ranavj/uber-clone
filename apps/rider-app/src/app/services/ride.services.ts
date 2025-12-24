import { Injectable, PLATFORM_ID, TransferState, inject, makeStateKey } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
      return 'http://localhost:3002/api'; 
    }
    return environment.rideApiUrl; // Expected: 'http://localhost:3002/api'
  }

  // 1. Get Ride Types (Moto, Auto, etc.)
  getRideTypes() {
    if (this.transferState.hasKey(RIDE_TYPES_KEY)) {
      const data = this.transferState.get(RIDE_TYPES_KEY, []);
      this.transferState.remove(RIDE_TYPES_KEY);
      return of(data);
    }

    return this.http.get<any[]>(`${this.apiUrl}/rides/types`).pipe(
      tap(data => {
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(RIDE_TYPES_KEY, data);
        }
      })
    );
  }

  // 2. Request A Ride (Create Booking)
  // 🧹 CLEANED: Manual Headers hata diye. Interceptor ab Token khud lagayega.
  requestRide(payload: any): Observable<Ride> {
    // URL: /api/rides/request
    return this.http.post<Ride>(`${this.apiUrl}/rides/request`, payload);
  }

  // 3. Get Initial Location (SSR IP Detect)
  getInitialLocation() {
    if (this.transferState.hasKey(LOCATION_KEY)) {
      const data = this.transferState.get(LOCATION_KEY, null);
      this.transferState.remove(LOCATION_KEY);
      if (data) {
        return of(data);
      }
    }

    return this.http.get<any>(`${this.apiUrl}/rides/location`).pipe(
      tap(data => {
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(LOCATION_KEY, data);
        }
      })
    );
  }

  getHistory() {
    return this.http.get<Ride[]>(`${this.apiUrl}/rides/history`);
  }

  cancelRide(rideId: string) {
    return this.http.patch<Ride>(`${this.apiUrl}/rides/${rideId}/cancel`, {});
  }

  getCurrentRide() {
    // GET /api/rides/current-active
    // Backend par yeh endpoint banana padega jo active ride return kare
    return this.http.get<Ride | null>(`${this.apiUrl}/rides/current-active`);
  }
}