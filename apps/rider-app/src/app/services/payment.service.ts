import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.rideApiUrl}/payment`; // http://localhost:3000/api/payment

  /**
   * Stripe se Client Secret mangwane ke liye
   * @param amount - Amount in Rupees (e.g., 500)
   */
  createIntent(amount: number): Observable<{ clientSecret: string; id: string }> {
    return this.http.post<{ clientSecret: string; id: string }>(
      `${this.apiUrl}/create-intent`, 
      { amount }
    );
  }
}