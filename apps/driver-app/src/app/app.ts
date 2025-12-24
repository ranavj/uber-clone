import { Component, inject, PLATFORM_ID, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

// Shared Libs
import { UiButton, UiMapComponent, MapMarkerConfig } from '@uber/ui';
import { SocketService } from '@uber-clone/socket-client';
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
  private socketService = inject(SocketService);
  private apiUrl = environment.rideApiUrl;

  isConnected = signal(false);
  incomingRide = signal<Ride | null>(null);
  activeRide = signal<Ride | null>(null);

  // 🗺️ MAP SIGNALS
  center = signal<google.maps.LatLngLiteral>({ lat: 28.6139, lng: 77.2090 });
  markers = signal<MapMarkerConfig[]>([]);
  directionsResult = signal<google.maps.DirectionsResult | null>(null);

  // Driver ID (Hardcoded for simulation)
  driverId = '4e90f50f-a7b7-4309-862b-959cf28a71ac';

  // Simulation Vars
  private simulationInterval: any;
  private routePath: any[] = [];
  private routeIndex = 0;
  private prevPos: google.maps.LatLngLiteral | null = null;

  get rideStatus() {
    return this.activeRide()?.status || '';
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // ✅ 1. Token Check (Refresh Fix)
      const token = localStorage.getItem('uber_token');

      if (!token) {
        // 🚨 Token missing? Get one from Dev API
        console.log('🔑 No Token found. Auto-logging in as Driver...');
        this.devLoginAndStart();
      } else {
        // ✅ Token found? Start normally
        this.startApp();
      }
    }
  }

  // 🛠️ AUTO-LOGIN LOGIC
  devLoginAndStart() {
    this.http.get<{ token: string }>(`${this.apiUrl}/rides/dev/token/${this.driverId}`).subscribe({
      next: (res) => {
        console.log('✅ Dev Token Received!');
        localStorage.setItem('uber_token', res.token); // Save Token
        this.startApp(); // Now Start
      },
      error: (err) => console.error('❌ Dev Login Failed:', err)
    });
  }

  // 🚀 MAIN APP STARTUP
  startApp() {
    this.getCurrentLocation();
    this.socketService.connect(); // Connects using the saved token
    this.setupSocketListeners();
    this.checkActiveRide(); // No more 401 error!
  }

  // 🔄 REFRESH RECOVERY LOGIC (Driver)
  checkActiveRide() {
    this.http.get<Ride>(`${this.apiUrl}/rides/current-active`).subscribe({
      next: (ride) => {
        if (ride && ride.status !== RideStatus.COMPLETED && ride.status !== RideStatus.CANCELLED) {
          console.log('♻️ Restoring Driver Session:', ride.id);

          this.activeRide.set(ride);

          if (ride.status === RideStatus.ACCEPTED ||
            ride.status === RideStatus.ARRIVED ||
            ride.status === RideStatus.IN_PROGRESS) {

            // Restore Navigation
            this.calculateAndStartSimulation(ride);
          }
        }
      },
      error: (err) => console.log('No active ride found for driver', err)
    });
  }

  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const myPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        this.center.set(myPos);
        this.updateDriverMarker(myPos);
      });
    }
  }

  private setupSocketListeners() {
    this.isConnected.set(true);
    this.socketService.listen(SOCKET_EVENTS.NEW_RIDE_AVAILABLE, (ride: Ride) => {
      console.log('🔔 New Ride Alert:', ride);
      if (!this.activeRide()) {
        this.incomingRide.set(ride);
      }
    });
  }

  acceptRide() {
    const ride = this.incomingRide();
    if (!ride) return;

    this.http.patch<Ride>(`${this.apiUrl}/rides/${ride.id}/accept`, {
      driverId: this.driverId
    }).subscribe({
      next: (updatedRide) => {
        this.incomingRide.set(null);
        this.activeRide.set(updatedRide);
        this.calculateAndStartSimulation(updatedRide);
      },
      error: (err) => console.error(err)
    });
  }

  rejectRide() {
    this.incomingRide.set(null);
  }

  updateRideStatus() {
    const ride = this.activeRide();
    if (!ride) return;

    let nextStatus: RideStatus | null = null;
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

        if (nextStatus === RideStatus.IN_PROGRESS) {
          if (!this.simulationInterval) {
            this.calculateAndStartSimulation(ride);
          }
        }

        if (nextStatus === RideStatus.COMPLETED) {
          this.stopSimulation();
          this.directionsResult.set(null);
          this.markers.set([]);
          alert(`Trip Finished! Fare: ₹${ride.price}`);
          this.activeRide.set(null);
          this.getCurrentLocation();
        }
      },
      error: (err) => console.error(err)
    });
  }

  // 🗺️ Visual + Simulation Logic
  calculateAndStartSimulation(ride: Ride) {
    if (typeof google === 'undefined') return;

    const directionsService = new google.maps.DirectionsService();

    const request = {
      origin: { lat: ride.pickupLat, lng: ride.pickupLng },
      destination: { lat: ride.dropLat, lng: ride.dropLng },
      travelMode: google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, (result: any, status: any) => {
      if (status === 'OK') {
        this.directionsResult.set(result);
        this.routePath = result.routes[0].overview_path;
        this.routeIndex = 0;
        this.startRoadSimulation(ride.id);
      }
    });
  }

  startRoadSimulation(rideId: string) {
    this.stopSimulation();
    const intervalTime = 1000;

    this.simulationInterval = setInterval(() => {
      if (this.routeIndex >= this.routePath.length) {
        this.stopSimulation();
        return;
      }

      const point = this.routePath[this.routeIndex];
      const lat = typeof point.lat === 'function' ? point.lat() : point.lat;
      const lng = typeof point.lng === 'function' ? point.lng() : point.lng;
      const pos = { lat, lng };

      this.updateDriverMarker(pos);
      this.center.set(pos);

      this.socketService.emit(SOCKET_EVENTS.UPDATE_DRIVER_LOCATION, {
        rideId: rideId,
        lat: lat,
        lng: lng,
        heading: 0
      });

      this.routeIndex++;
    }, intervalTime);
  }

  updateDriverMarker(pos: google.maps.LatLngLiteral) {
    if (!pos || !pos.lat || !pos.lng) return;
    if (typeof google === 'undefined') return;

    let heading = 0;
    if (this.prevPos && google.maps.geometry) {
      heading = google.maps.geometry.spherical.computeHeading(this.prevPos, pos);
    }
    this.prevPos = pos;

    const driverIcon = {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 6,
      fillColor: "#000000",
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: "#FFFFFF",
      rotation: heading,
    };

    this.markers.set([{
      position: pos,
      title: 'Me',
      options: {
        icon: driverIcon,
        zIndex: 9999
      }
    }]);
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
    this.socketService.disconnect();
    this.stopSimulation();
  }
}