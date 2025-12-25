import { Component, inject, PLATFORM_ID, signal, OnInit, OnDestroy, effect } from '@angular/core'; // ✅ Added effect
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

import { UiButton, UiMapComponent, MapMarkerConfig } from '@uber/ui';
import { SocketService } from '@uber-clone/socket-client';
import { Ride, RideStatus, SOCKET_EVENTS } from '@uber-clone/interfaces';
import { DriverSidebar } from './ui/driver-sidebar/driver-sidebar';

declare var google: any;

@Component({
  imports: [RouterModule, UiButton, UiMapComponent, DriverSidebar],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private socketService = inject(SocketService);
  private apiUrl = environment.rideApiUrl;
  private router = inject(Router);
  isConnected = signal(false);
  incomingRide = signal<Ride | null>(null);
  activeRide = signal<Ride | null>(null);

  // 🗺️ MAP SIGNALS
  center = signal<google.maps.LatLngLiteral>({ lat: 28.6139, lng: 77.2090 });
  markers = signal<MapMarkerConfig[]>([]);
  directionsResult = signal<google.maps.DirectionsResult | null>(null);
  isMenuOpen = signal(false);
  // ✅ NEW: Central Position Signal (The Source of Truth)
  driverPosition = signal<google.maps.LatLngLiteral | null>(null);

  driverId = '4e90f50f-a7b7-4309-862b-959cf28a71ac';

  // Simulation Vars
  private simulationInterval: any;
  private routePath: any[] = [];
  private routeIndex = 0;
  private prevPos: google.maps.LatLngLiteral | null = null;

  constructor() {
    // MAGIC: Effect monitors the signal
    // Chahe GPS se location aaye ya Simulation se, Marker yahi update hoga.
    effect(() => {
      const pos = this.driverPosition();
      if (pos) {
        this.updateDriverMarker(pos);
        this.center.set(pos); // Keep camera focused on driver
      }
    });
  }

  get rideStatus() {
    return this.activeRide()?.status || '';
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('uber_token');
      if (!token) {
        console.log('🔑 Auto-logging in...');
        this.devLoginAndStart();
      } else {
        this.startApp();
      }
    }
  }

  // ✅ 2. TOGGLE MENU
  toggleMenu() {
    this.isMenuOpen.update(val => !val);
  }

  // ✅ 3. LOGOUT LOGIC
  logout() {
    // Token saaf karo
    localStorage.removeItem('uber_token');
    
    // Simulation roko (background mein na chalta rahe)
    this.stopSimulation();
    
    // Socket disconnect karo
    this.socketService.disconnect();

    // Login page par bhejo
    this.router.navigate(['/login']);
  }
  devLoginAndStart() {
    this.http.get<{ token: string }>(`${this.apiUrl}/rides/dev/token/${this.driverId}`).subscribe({
      next: (res) => {
        localStorage.setItem('uber_token', res.token);
        this.startApp();
      },
      error: (err) => console.error('Login Failed:', err)
    });
  }

  startApp() {
    this.getCurrentLocation();
    this.socketService.connect();
    this.setupSocketListeners();
    this.checkActiveRide();
  }

  checkActiveRide() {
    this.http.get<Ride>(`${this.apiUrl}/rides/current-active`).subscribe({
      next: (ride) => {
        if (ride && ride.status !== RideStatus.COMPLETED && ride.status !== RideStatus.CANCELLED) {
          console.log('♻️ Restoring Session:', ride.id);
          this.activeRide.set(ride);
          if ([RideStatus.ACCEPTED, RideStatus.ARRIVED, RideStatus.IN_PROGRESS].includes(ride.status as any)) {
            this.calculateAndStartSimulation(ride);
          }
        }
      }
    });
  }

  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const myPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        // ✅ Signal set kiya. Effect apne aap handle karega.
        this.driverPosition.set(myPos);
      });
    }
  }

  private setupSocketListeners() {
    this.isConnected.set(true);
    this.socketService.listen(SOCKET_EVENTS.NEW_RIDE_AVAILABLE, (ride: Ride) => {
      if (!this.activeRide()) this.incomingRide.set(ride);
    });
  }

  acceptRide() {
    const ride = this.incomingRide();
    if (!ride) return;
    this.http.patch<Ride>(`${this.apiUrl}/rides/${ride.id}/accept`, { driverId: this.driverId }).subscribe({
      next: (updatedRide) => {
        this.incomingRide.set(null);
        this.activeRide.set(updatedRide);
        this.calculateAndStartSimulation(updatedRide);
      }
    });
  }

  rejectRide() {
    this.incomingRide.set(null);
  }

  updateRideStatus() {
    const ride = this.activeRide();
    if (!ride) return;
    
    // Simple Next Status Logic
    const nextStatusMap: any = {
      [RideStatus.ACCEPTED]: RideStatus.ARRIVED,
      [RideStatus.ARRIVED]: RideStatus.IN_PROGRESS,
      [RideStatus.IN_PROGRESS]: RideStatus.COMPLETED
    };
    const nextStatus = nextStatusMap[ride.status];
    if (!nextStatus) return;

    this.http.patch<Ride>(`${this.apiUrl}/rides/${ride.id}/status`, { status: nextStatus }).subscribe({
      next: (updatedRide) => {
        this.activeRide.set(updatedRide);

        if (nextStatus === RideStatus.IN_PROGRESS && !this.simulationInterval) {
           this.calculateAndStartSimulation(ride);
        }
        if (nextStatus === RideStatus.COMPLETED) {
          this.stopSimulation();
          this.directionsResult.set(null);
          this.markers.set([]);
          alert(`Trip Finished! Fare: ₹${ride.price}`);
          this.activeRide.set(null);
          this.getCurrentLocation();
        }
      }
    });
  }

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

      // ✅ OPTIMIZED: Update Signal Only
      this.driverPosition.set(pos);

      // Emit to Server
      this.socketService.emit(SOCKET_EVENTS.UPDATE_DRIVER_LOCATION, {
        rideId, lat, lng, heading: 0
      });

      this.routeIndex++;
    }, intervalTime);
  }

  updateDriverMarker(pos: google.maps.LatLngLiteral) {
    if (!pos || typeof google === 'undefined') return;

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
      options: { icon: driverIcon, zIndex: 9999 }
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