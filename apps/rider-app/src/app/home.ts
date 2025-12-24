import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, OnInit, OnDestroy, PLATFORM_ID, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

// Services
import { RideService } from './services/ride.services';
import { Auth } from './services/auth';
import { SocketService } from '@uber-clone/socket-client';
// ✅ NEW: Injected Services for Logic Separation

// UI Components
import { MapMarkerConfig, UiButton, UiMapComponent } from '@uber/ui';
import { Meta, Title } from '@angular/platform-browser';

// Shared Interfaces
import { Ride, Driver, RideStatus, SOCKET_EVENTS } from '@uber-clone/interfaces';
import { MarkerAnimation } from './services/marker-animation';
import { MapUtils } from './services/map-utils';
import { RideSelection } from './ui/ride-selection';
import { RideSummary } from './ui/ride-summary/ride-summary';
import { SearchingLoader } from './ui/searching-loader/searching-loader';
import { TripDetails } from './ui/trip-details/trip-details';
import { HotToastService } from '@ngneat/hot-toast';

interface RideOption {
  id: string;
  name: string;
  image: string;
  price: number;
  time: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, UiMapComponent, UiButton, RideSelection, RideSummary, SearchingLoader, TripDetails],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
  // Dependencies
  private platformId = inject(PLATFORM_ID);
  private rideService = inject(RideService);
  private authService = inject(Auth);
  private router = inject(Router);
  private socketService = inject(SocketService);
  private meta = inject(Meta);
  private title = inject(Title);

  // ✅ NEW INJECTIONS
  private mapUtils = inject(MapUtils);
  private animator = inject(MarkerAnimation);
  private toast = inject(HotToastService);
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  // --- SIGNALS ---
  center = signal<google.maps.LatLngLiteral>({ lat: 28.6139, lng: 77.2090 });
  markers = signal<MapMarkerConfig[]>([]);
  directionsResult = signal<google.maps.DirectionsResult | null>(null);
  rideOptions = signal<RideOption[]>([]);
  bookingStage = signal<'select-ride' | 'searching' | 'confirmed' | 'trip-started' | 'summary'>('select-ride');

  // State Signals
  assignedDriver = signal<Driver | null>(null);
  completedRide = signal<Ride | null>(null);
  activeRide = signal<Ride | null>(null);

  // Class Variables
  sourceLocation: google.maps.LatLngLiteral | null = null;
  currentCarPos: google.maps.LatLngLiteral | null = null;
  carIcon: google.maps.Icon = {
    url: 'https://cdn-icons-png.flaticon.com/512/11104/11104431.png',
    scaledSize: { width: 40, height: 40, equals: () => false } as google.maps.Size,
  };
  rideConfigs: any[] = [];

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.getCurrentLocation();
      this.socketService.connect();
      this.checkForActiveRide();
    }


    this.rideService.getRideTypes().subscribe(configs => this.rideConfigs = configs);

    this.rideService.getInitialLocation().subscribe(serverLoc => {
      if (serverLoc && serverLoc.lat && serverLoc.lng) {
        this.title.setTitle(`Book Uber in ${serverLoc.city} | Fast & Affordable`);
        setTimeout(() => {
          if (!this.sourceLocation) this.center.set({ lat: serverLoc.lat, lng: serverLoc.lng });
        }, 0);
      }
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) this.initAutocomplete();
  }

  // 🔄 REFRESH RECOVERY
  checkForActiveRide() {
    this.rideService.getCurrentRide().subscribe({
      next: (ride) => {
        if (ride && ride.status !== 'COMPLETED' && ride.status !== 'CANCELLED') {
          console.log('♻️ Restoring Session for Ride:', ride.id);

          // 1. State Restore
          this.activeRide.set(ride);
          if (ride.driver) this.assignedDriver.set(ride.driver);

          // 2. UI Restore
          switch (ride.status) {
            case RideStatus.SEARCHING:
              this.bookingStage.set('searching');
              break;
            case RideStatus.ACCEPTED:
            case RideStatus.ARRIVED:
              this.bookingStage.set('confirmed');
              // Driver dhikhao (Start point par ya last known location par)
              this.resetMapForTrip();
              break;
            case RideStatus.IN_PROGRESS:
              this.bookingStage.set('trip-started');
              // Map ko active mode mein rakho
              this.markers.set([]); // Socket se location aate hi marker aa jayega
              break;
          }

          // 3. Socket Reconnect
          this.listenToRideEvents(ride.id);
        }
      },
      error: (err) => console.log('No active ride to restore.')
    });
  }

  // 🧠 CENTRAL BRAIN: Handles all socket updates (New or Restore)
  listenToRideEvents(rideId: string) {
    console.log('🔌 Listening to events for:', rideId);

    // 1. Status Updates (Searching -> Accepted -> Arrived -> Started -> Completed)
    const statusEvent = SOCKET_EVENTS.RIDE_STATUS_UPDATE(rideId);

    this.socketService.listen(statusEvent, (updatedRide: Ride) => {
      console.log('🔔 Status Update:', updatedRide.status);
      this.activeRide.set(updatedRide);

      switch (updatedRide.status) {

        case RideStatus.ACCEPTED:
          if (updatedRide.driver) {
            this.assignedDriver.set(updatedRide.driver);
            this.bookingStage.set('confirmed');

            // Agar map par driver nahi hai toh draw karo
            if (this.markers().length === 0) this.resetMapForTrip();
          }
          break;

        case RideStatus.ARRIVED:
          this.bookingStage.set('confirmed');
          this.toast.success('🚖 Driver has Arrived!');
          break;

        case RideStatus.IN_PROGRESS:
          this.bookingStage.set('trip-started');
          break;

        case RideStatus.COMPLETED:
          this.completedRide.set(updatedRide);
          this.bookingStage.set('summary');
          this.activeRide.set(null);
          this.animator.stopAnimation(); // Stop moving car
          this.markers.set([]); // Clear map
          break;

        case RideStatus.CANCELLED:
          this.resetState();
          this.toast.error('Ride was cancelled.');
          break;
      }
    });

    // 2. Live Tracking (Driver Location)
    const locationEvent = SOCKET_EVENTS.DRIVER_LOCATION_UPDATE(rideId);
    this.socketService.listen(locationEvent, (location: any) => {
      const newPos = { lat: location.lat, lng: location.lng };

      if (!this.currentCarPos) {
        // Pehli baar location aayi (Direct set karo)
        this.currentCarPos = newPos;
        this.updateDriverMarker(newPos);
      } else {
        // Pehle se car thi (Smooth Animate karo)
        this.animator.animateMarker(this.currentCarPos, newPos, 1000, (updatedPos) => {
          this.updateDriverMarker(updatedPos);
          this.currentCarPos = updatedPos;
        });
      }
    });
  }

  // --- MAP & LOCATION LOGIC (Cleaned Up) ---
  getCurrentLocation() {
    if (isPlatformBrowser(this.platformId) && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
          this.sourceLocation = pos;
          this.center.set(pos);
          this.addMarker(pos, 'You are here');

          // ✅ OLD: Complex loop logic removed
          // ✅ NEW: Delegate to MapUtilsService
          const dummyCars = this.mapUtils.generateNearbyCars(pos, this.carIcon);
          this.markers.update(curr => [...curr, ...dummyCars]);
        },
        (error) => console.error('Location Error:', error)
      );
    }
  }

  private addMarker(position: google.maps.LatLngLiteral, title: string) {
    const newMarker: MapMarkerConfig = {
      position,
      title,
      options: { animation: google.maps.Animation.DROP }
    };
    this.markers.update(current => [...current, newMarker]);
  }

  initAutocomplete() {
    if (!google || !google.maps || !google.maps.places) return;
    const autocomplete = new google.maps.places.Autocomplete(this.searchInput.nativeElement, { types: ['establishment', 'geocode'], componentRestrictions: { country: 'IN' } });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const destPos = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
        this.center.set(destPos);
        if (this.sourceLocation) this.calculateRoute(this.sourceLocation, destPos);
        else this.addMarker(destPos, 'Destination');
      }
    });
  }

  // ✅ Logic Moved to Service
  async calculateRoute(from: google.maps.LatLngLiteral, to: google.maps.LatLngLiteral) {
    try {
      const response = await this.mapUtils.calculateRoute(from, to);
      this.directionsResult.set(response);

      const options = this.mapUtils.estimatePrices(response, this.rideConfigs);
      this.rideOptions.set(options);
    } catch (error) {
      console.error(error);
    }
  }

  // --- 🚕 BOOKING LOGIC ---
  // 🚕 Booking Request
  requestRide(rideId: string) {
    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.bookingStage.set('searching');

    const ridePayload = {
      pickupLat: this.sourceLocation?.lat || 28.6139,
      pickupLng: this.sourceLocation?.lng || 77.2090,
      dropLat: this.center().lat,
      dropLng: this.center().lng,
      pickupAddr: "Current Location",
      dropAddr: "Destination",
      price: 150,
      riderId: user.id
    };

    this.rideService.requestRide(ridePayload).subscribe({
      next: (ride: Ride) => {
        console.log('✅ Ride Requested:', ride.id);
        this.activeRide.set(ride);

        // 👇 MAGIC: Logic Reuse! (No duplication)
        this.listenToRideEvents(ride.id);
      },
      error: (err) => {
        this.toast.error('Booking Failed!');
        this.bookingStage.set('select-ride');
      }
    });
  }

  handleMockDriverFound() {
    const driver: Driver = { id: 'mock', name: 'Vikram', email: 'test', phone: '123', carModel: 'Swift', carNumber: 'DL123', carType: 'uber_go', rating: 4.8, isOnline: true };
    this.assignedDriver.set(driver);
    this.bookingStage.set('confirmed');
    this.resetMapForTrip();
  }

  resetMapForTrip() {
    this.markers.set([]);
    if (this.sourceLocation) {
      this.addMarker(this.sourceLocation, 'You');
      const mockDriverStart = { lat: this.sourceLocation.lat + 0.01, lng: this.sourceLocation.lng + 0.01 };

      // ✅ NEW: Clean Mock Animation
      this.animator.animateMarker(mockDriverStart, this.sourceLocation, 2000, (pos) => {
        this.updateDriverMarker(pos);
      });
    }
  }

  updateDriverMarker(pos: google.maps.LatLngLiteral) {
    this.markers.update(current => {
      const userMarker = current.find(m => m.title === 'You' || m.title === 'Destination');
      const driverMarker: MapMarkerConfig = {
        position: pos,
        title: 'Your Driver',
        options: { icon: this.carIcon, zIndex: 100 }
      };
      return userMarker ? [userMarker, driverMarker] : [driverMarker];
    });
  }

  submitRating() {
    // 1. Toast dikhao
    this.toast.success('Thanks for rating! 🌟', {
      duration: 3000, // Library ko bolo 3 sec
      position: 'bottom-center',
      style: {
        border: '1px solid #22c55e',
        padding: '16px',
        color: '#14532d',
        background: '#f0fdf4',
        fontWeight: 'bold',
      }
    });

    // 2. State Reset
    this.resetUI();

    // 3. 💣 NUCLEAR OPTION: 3 second baad zabardasti HTML se udao
    setTimeout(() => {
      // Jitne bhi toast containers hain, sabko pakdo
      const elements = document.querySelectorAll('.hot-toast-bar-base-container');

      // Sabko delete kar do
      elements.forEach(el => el.remove());

    }, 3000); // 3000ms = 3 seconds
  }

  resetUI() {
    this.resetState();
    this.markers.set([]);
    this.directionsResult.set(null);
    if (this.sourceLocation) {
      this.addMarker(this.sourceLocation, 'You');
      this.center.set(this.sourceLocation);
    }
  }

  cancelRequest() {
    const ride = this.activeRide() || this.completedRide();
    if (this.bookingStage() === 'select-ride') {
      this.resetState();
      return;
    }
    if (!ride) return;

    if (confirm('Are you sure you want to cancel?')) {
      this.rideService.cancelRide(ride.id).subscribe({
        next: () => {
          this.resetState();
          alert('Ride cancelled successfully');
        },
        error: () => alert('Could not cancel ride')
      });
    }
  }

  private resetState() {
    this.bookingStage.set('select-ride');
    this.rideOptions.set([]);
    this.activeRide.set(null);
    this.completedRide.set(null);
    this.assignedDriver.set(null);
  }

  ngOnDestroy() {
    this.socketService.disconnect();
    this.animator.stopAnimation(); // Clean Service call
  }
}