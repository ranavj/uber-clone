import { Component, inject, PLATFORM_ID, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { UiButton, UiMapComponent } from '@uber/ui'; 
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment'; 

// ✅ 1. Import Shared Socket Library (Local service hataya)
import { SocketService } from '@uber-clone/socket-client';

// ✅ 2. Import Shared Interfaces & Constants
import { Ride, RideStatus, SOCKET_EVENTS } from '@uber-clone/interfaces';

declare var google: any;

@Component({
  imports: [RouterModule, UiButton, UiMapComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  
  // ✅ Inject Shared Service
  private socketService = inject(SocketService);
  
  private apiUrl = environment.rideApiUrl; 

  isConnected = signal(false);

  // ✅ 3. Type Safety Applied (No more 'any')
  incomingRide = signal<Ride | null>(null);
  activeRide = signal<Ride | null>(null);
  
  // ⚠️ Ensure this ID matches your DB Driver ID
  driverId = '4e90f50f-a7b7-4309-862b-959cf28a71ac'; 

  // Simulation Vars
  private simulationInterval: any;
  private routePath: any[] = []; 
  private routeIndex = 0; 

  get rideStatus() {
    return this.activeRide()?.status || '';
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // ✅ 4. Connect via Library
      this.socketService.connect();
      this.setupSocketListeners();
    }
  }

  private setupSocketListeners() {
    this.isConnected.set(true);

    // ✅ 5. Listen using Constant (Spelling mistake proof)
    this.socketService.listen(SOCKET_EVENTS.NEW_RIDE_AVAILABLE, (ride: Ride) => {
      console.log('🔔 New Ride Alert via Service:', ride);
      if (!this.activeRide()) {
        this.incomingRide.set(ride);
      }
    });
  }

  acceptRide() {
    const ride = this.incomingRide();
    if (!ride) return;

    // ✅ Added <Ride> generic for type safety
    this.http.patch<Ride>(`${this.apiUrl}/rides/${ride.id}/accept`, {
      driverId: this.driverId
    }).subscribe({
      next: (updatedRide) => { 
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

    let nextStatus: RideStatus | null = null;

    // ✅ 6. Logic: Using Enum instead of strings
    switch (ride.status) {
      case RideStatus.ACCEPTED: nextStatus = RideStatus.ARRIVED; break;
      case RideStatus.ARRIVED: nextStatus = RideStatus.IN_PROGRESS; break;
      case RideStatus.IN_PROGRESS: nextStatus = RideStatus.COMPLETED; break;
      default: return;
    }

    if (!nextStatus) return;

    this.http.patch<Ride>(`${this.apiUrl}/rides/${ride.id}/status`, {
      status: nextStatus
    }).subscribe({
      next: (updatedRide) => {
        this.activeRide.set(updatedRide);

        // 🚦 START SIMULATION
        if (nextStatus === RideStatus.IN_PROGRESS) {
          this.calculateAndStartSimulation(ride);
        }
        
        // 🏁 STOP SIMULATION
        if (nextStatus === RideStatus.COMPLETED) {
          this.stopSimulation();
          alert(`Trip Finished! Fare: ₹${ride.price}`);
          this.activeRide.set(null);
        }
      },
      error: (err) => console.error(err)
    });
  }

  // 🗺️ Google Maps Route Logic
  calculateAndStartSimulation(ride: Ride) {
    console.log('🗺️ Calculating Route on Road...');
    
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
        this.routePath = result.routes[0].overview_path;
        this.routeIndex = 0;
        
        console.log(`🛣️ Route Found with ${this.routePath.length} points`);
        this.startRoadSimulation(ride.id);
      } else {
        console.error('Directions request failed:', status);
      }
    });
  }

  // 🏎️ Simulation Engine
  startRoadSimulation(rideId: string) {
    this.stopSimulation(); 
    const intervalTime = 500; 

    this.simulationInterval = setInterval(() => {
      if (this.routeIndex >= this.routePath.length) {
        this.stopSimulation();
        console.log('🏁 Reached Destination (Simulation End)');
        return;
      }

      const point = this.routePath[this.routeIndex];
      const lat = point.lat();
      const lng = point.lng();

      // ✅ 7. Emit using Constant (Type Safe Emit)
      this.socketService.emit(SOCKET_EVENTS.UPDATE_DRIVER_LOCATION, {
        rideId: rideId,
        lat: lat,
        lng: lng,
        heading: 0
      });

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

  ngOnDestroy() {
    // Cleanup
    this.socketService.disconnect();
    this.stopSimulation();
  }
}