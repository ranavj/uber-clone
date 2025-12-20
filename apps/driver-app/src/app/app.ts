import { Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { UiButton, UiMapComponent } from '@uber/ui'; // Shared UI button
import { isPlatformBrowser } from '@angular/common';
@Component({
  imports: [RouterModule, UiButton, UiMapComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private socket!: Socket;
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID); // Inject Platform ID

  isConnected = signal(false);
  incomingRide = signal<any>(null);
  activeRide = signal<any>(null);
  driverId = '4e90f50f-a7b7-4309-862b-959cf28a71ac'; //  ID check kar lena

  get rideStatus() {
    return this.activeRide()?.status || '';
  }
  ngOnInit() {
    //  SSR Guard: Sirf Browser mein run karo
    if (isPlatformBrowser(this.platformId)) {
      this.initSocket();
    }
  }

  private initSocket() {
    this.socket = io('http://localhost:3000');

    this.socket.on('connect', () => {
      this.isConnected.set(true);
      console.log('✅ Driver App Connected:', this.socket.id);
    });

    this.socket.on('new-ride-available', (ride: any) => {
      // Agar hum already ride par nahi hain, tabhi popup dikhao
      if (!this.activeRide()) {
        this.incomingRide.set(ride);
      }
    });
  }

  acceptRide() {
    const ride = this.incomingRide();
    if (!ride) return;

    this.http.patch(`http://localhost:3000/api/rides/${ride.id}/accept`, {
      driverId: this.driverId
    }).subscribe({
      next: (updatedRide: any) => { 
        console.log('Ride Accepted:', updatedRide);
        this.incomingRide.set(null);
        this.activeRide.set(updatedRide); 

        alert('Navigation Started! 🏁');
      },
      error: (err) => {
        console.error(err);
        alert('Error accepting ride');
      }
    });
  }

  rejectRide() {
    this.incomingRide.set(null);
  }

  completeRide() {
    // Abhi ke liye bas reset kar dete hain demo ke liye
    alert('Ride Completed! Payment Collected.');
    this.activeRide.set(null);
  }

  updateRideStatus() {
    const ride = this.activeRide();
    if (!ride) return;

    let nextStatus = '';

    // Logic: Current status kya hai, agla kya hoga?
    switch (ride.status) {
      case 'ACCEPTED':
        nextStatus = 'ARRIVED';
        break;
      case 'ARRIVED':
        nextStatus = 'IN_PROGRESS';
        break;
      case 'IN_PROGRESS':
        nextStatus = 'COMPLETED';
        break;
      default:
        return;
    }

    // API Call
    this.http.patch(`http://localhost:3000/api/rides/${ride.id}/status`, {
      status: nextStatus
    }).subscribe({
      next: (updatedRide: any) => {
        if (nextStatus === 'COMPLETED') {
          alert(`Trip Finished! Fare: ₹${ride.price}`);
          this.activeRide.set(null); // Home screen par wapas
        } else {
          // Status update karo taaki Button ka text badal jaye
          this.activeRide.set(updatedRide); 
        }
      },
      error: (err) => console.error('Error updating status', err)
    });
  }
}
