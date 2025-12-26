import { Injectable, PLATFORM_ID, TransferState, inject, makeStateKey } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { Ride } from '@uber-clone/interfaces';

const RIDE_TYPES_KEY = makeStateKey<any[]>('ride_types_config');
const LOCATION_KEY = makeStateKey<any>('user_ip_location');

@Injectable({
  providedIn: 'root'
})
export class RideService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private transferState = inject(TransferState);

  // 🛠️ FIX: Direct Gateway URL use karein
  get apiUrl() {
    return environment.rideApiUrl; // http://localhost:3000/api
  }

  // 1. Get Ride Types
  getRideTypes() {
    if (this.transferState.hasKey(RIDE_TYPES_KEY)) {
      const data = this.transferState.get(RIDE_TYPES_KEY, []);
      this.transferState.remove(RIDE_TYPES_KEY);
      return of(data);
    }

    // URL: http://localhost:3000/api/rides/types
    return this.http.get<any[]>(`${this.apiUrl}/rides/types`).pipe(
      tap(data => {
        if (!isPlatformBrowser(this.platformId)) {
          this.transferState.set(RIDE_TYPES_KEY, data);
        }
      })
    );
  }

  // 2. Request A Ride
  requestRide(payload: any): Observable<Ride> {
    return this.http.post<Ride>(`${this.apiUrl}/rides/request`, payload);
  }

  // 3. Get Initial Location
  getInitialLocation() {
    if (this.transferState.hasKey(LOCATION_KEY)) {
      const data = this.transferState.get(LOCATION_KEY, null);
      this.transferState.remove(LOCATION_KEY);
      if (data) return of(data);
    }

    return this.http.get<any>(`${this.apiUrl}/rides/location`).pipe(
      tap(data => {
        if (!isPlatformBrowser(this.platformId)) {
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
    return this.http.get<Ride | null>(`${this.apiUrl}/rides/current-active`);
  }
}