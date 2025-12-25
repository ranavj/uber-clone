import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, startWith, Subject, switchMap, concat, delay } from 'rxjs'; // ✅ Added 'concat'

import { RideService } from '../services/ride.services';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './history.html',
  styleUrl: './history.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class History {
  private rideService = inject(RideService);

  private retryTrigger$ = new Subject<void>();

  rides = toSignal(
    this.retryTrigger$.pipe(
      startWith(void 0),
      switchMap(() =>

        // TRICK: Retry dabate hi pehle 'undefined' (Loading) bhejo, phir API call karo
        concat(
          of(undefined).pipe(delay(100)),

          this.rideService.getHistory().pipe(
            catchError(err => {
              console.error('History API Failed:', err);
              return of(null); // Error State
            })
          )
        )
      )
    ),
    { initialValue: undefined }
  );

  onRetry() {
    this.retryTrigger$.next();
  }

  // Status Color Helper
  getStatusClass(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse';
      case 'CANCELLED': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  }
}