import { Component, inject, PLATFORM_ID, signal, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { UiButton, UiMapComponent } from '@uber/ui'; 
import { isPlatformBrowser } from '@angular/common';
// 👇 Environment Import (Path ensure kar lena)
import { environment } from '../../environments/environment'; 

// 👇 TypeScript ko batane ke liye ki 'google' exist karta hai
declare var google: any;

@Component({
  imports: [RouterModule, UiButton, UiMapComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private socket!: Socket;
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  
  // 👇 API URL Environment se
  private apiUrl = environment.apiUrl; 

  isConnected = signal(false);
  incomingRide = signal<any>(null);
  activeRide = signal<any>(null);
  
  // ⚠️ Driver ID (Apni database wali sahi ID yahan rakhein)
  driverId = '4e90f50f-a7b7-4309-862b-959cf28a71ac'; 

  // 👇 ROAD SIMULATION VARIABLES
  private simulationInterval: any;
  private routePath: any[] = []; // Rasta yahan store hoga
  private routeIndex = 0; // Hum raste mein kahan hain

  get rideStatus() {
    return this.activeRide()?.status || '';
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initSocket();
    }
  }

  private initSocket() {
    // Socket URL logic (http://localhost:3000)
    const socketUrl = this.apiUrl.replace('/api', '');
    this.socket = io(socketUrl);

    this.socket.on('connect', () => {
      this.isConnected.set(true);
      console.log('✅ Driver App Connected:', this.socket.id);
    });

    this.socket.on('new-ride-available', (ride: any) => {
      if (!this.activeRide()) {
        this.incomingRide.set(ride);
      }
    });
  }

  acceptRide() {
    const ride = this.incomingRide();
    if (!ride) return;

    this.http.patch(`${this.apiUrl}/rides/${ride.id}/accept`, {
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

  updateRideStatus() {
    const ride = this.activeRide();
    if (!ride) return;

    let nextStatus = '';

    // Logic: Status change
    switch (ride.status) {
      case 'ACCEPTED': nextStatus = 'ARRIVED'; break;
      case 'ARRIVED': nextStatus = 'IN_PROGRESS'; break;
      case 'IN_PROGRESS': nextStatus = 'COMPLETED'; break;
      default: return;
    }

    this.http.patch(`${this.apiUrl}/rides/${ride.id}/status`, {
      status: nextStatus
    }).subscribe({
      next: (updatedRide: any) => {
        this.activeRide.set(updatedRide);

        // 🚦 START SIMULATION (SNAP TO ROAD)
        if (nextStatus === 'IN_PROGRESS') {
          // Pehle Google se rasta pucho, phir chalao
          this.calculateAndStartSimulation(ride);
        }
        
        // 🏁 STOP SIMULATION
        if (nextStatus === 'COMPLETED') {
          this.stopSimulation();
          alert(`Trip Finished! Fare: ₹${ride.price}`);
          this.activeRide.set(null);
        }
      },
      error: (err) => console.error(err)
    });
  }

  // 🗺️ STEP 1: Google se Road Path Nikalo
  calculateAndStartSimulation(ride: any) {
    console.log('🗺️ Calculating Route on Road...');
    
    // Safety check: Agar Google load nahi hua
    if (typeof google === 'undefined') {
      console.error('Google Maps not loaded');
      return;
    }

    const directionsService = new google.maps.DirectionsService();
    
    const request = {
      origin: { lat: ride.pickupLat, lng: ride.pickupLng },
      destination: { lat: ride.dropLat, lng: ride.dropLng },
      travelMode: google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, (result: any, status: any) => {
      if (status === 'OK') {
        // ✅ Road Points mil gaye (overview_path)
        this.routePath = result.routes[0].overview_path;
        this.routeIndex = 0;
        
        console.log(`🛣️ Route Found with ${this.routePath.length} points`);
        this.startRoadSimulation(ride.id);
      } else {
        console.error('Directions request failed:', status);
      }
    });
  }

  // 🏎️ STEP 2: Road Points par Gaadi Chalao
  startRoadSimulation(rideId: string) {
    this.stopSimulation(); // Reset agar pehle se chal raha ho

    // Speed: 500ms (Fast update for demo)
    const intervalTime = 500; 

    this.simulationInterval = setInterval(() => {
      // Check: Kya hum destination pahunch gaye?
      if (this.routeIndex >= this.routePath.length) {
        this.stopSimulation();
        console.log('🏁 Reached Destination (Simulation End)');
        return;
      }

      // Current Point nikalo
      const point = this.routePath[this.routeIndex];
      const lat = point.lat(); // Google Maps point function hai
      const lng = point.lng();

      // 🔥 Socket Emit (Corrected)
      this.socket.emit('updateDriverLocation', {
        rideId: rideId,
        lat: lat,
        lng: lng,
        heading: 0 // Future enhancement
      });

      // Next point par badho
      this.routeIndex++;

    }, intervalTime);
  }

  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
      this.routePath = [];
      this.routeIndex = 0;
    }
  }
}