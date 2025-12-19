import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RideService {
  private http = inject(HttpClient);
  
  // 👇 Backend URL (Auth service ka address + global prefix 'api')
  private apiUrl = `${environment.apiUrl}/rides`;

  requestRide(rideData: any): Observable<any> {
    // POST Request bhej rahe hain
    return this.http.post(this.apiUrl, rideData);
  }
}