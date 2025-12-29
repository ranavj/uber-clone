import { Component, AfterViewInit, viewChild, ElementRef, inject, OnInit, OnDestroy, PLATFORM_ID, signal, effect } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

// Services & Core
import { RideService } from './services/ride.services';
import { Auth } from './services/auth';
import { SocketService } from '@uber-clone/socket-client';
import { MarkerAnimation } from './services/marker-animation';
import { MapUtils } from './services/map-utils';

// UI Components
import { MapMarkerConfig, UiMapComponent } from '@uber/ui';
import { RideSelection } from './ui/ride-selection';
import { RideSummary } from './ui/ride-summary/ride-summary';
import { SearchingLoader } from './ui/searching-loader/searching-loader';
import { TripDetails } from './ui/trip-details/trip-details';
import { RiderSidebar } from './ui/rider-sidebar/rider-sidebar';

// ✅ NEW: Sonner static import
import { toast } from 'ngx-sonner'; 

// Shared Interfaces
import { Ride, Driver, RideStatus, SOCKET_EVENTS } from '@uber-clone/interfaces';

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
  imports: [CommonModule, UiMapComponent, RiderSidebar, RideSelection, RideSummary, SearchingLoader, TripDetails, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private rideService = inject(RideService);
  private authService = inject(Auth);
  private router = inject(Router);
  private socketService = inject(SocketService);
  private meta = inject(Meta);
  private title = inject(Title);
  private mapUtils = inject(MapUtils);
  private animator = inject(MarkerAnimation);

  isMenuOpen = signal(false);
  searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  center = signal<google.maps.LatLngLiteral>({ lat: 28.6139, lng: 77.2090 });
  markers = signal<MapMarkerConfig[]>([]);
  directionsResult = signal<google.maps.DirectionsResult | null>(null);
  rideOptions = signal<RideOption[]>([]);
  bookingStage = signal<'select-ride' | 'searching' | 'confirmed' | 'trip-started' | 'summary'>('select-ride');

  assignedDriver = signal<Driver | null>(null);
  completedRide = signal<Ride | null>(null);
  activeRide = signal<Ride | null>(null);
  driverLocation = signal<google.maps.LatLngLiteral | null>(null);

  rideConfigs = toSignal(this.rideService.getRideTypes(), { initialValue: [] });

  sourceLocation: google.maps.LatLngLiteral | null = null;
  currentCarPos: google.maps.LatLngLiteral | null = null;
  carIcon: google.maps.Icon = {
    url: 'https://cdn-icons-png.flaticon.com/512/11104/11104431.png',
    scaledSize: { width: 40, height: 40, equals: () => false } as google.maps.Size,
  };

  constructor() {
    effect(() => {
      const newPos = this.driverLocation();
      if (newPos) {
        if (!this.currentCarPos) {
          this.currentCarPos = newPos;
          this.updateDriverMarker(newPos);
        } else {
          this.animator.animateMarker(this.currentCarPos, newPos, 1000, (updatedPos) => {
            this.updateDriverMarker(updatedPos);
            this.currentCarPos = updatedPos;
          });
        }
      }
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.getCurrentLocation();
      this.socketService.connect();
      this.checkForActiveRide();
    }

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
    if (isPlatformBrowser(this.platformId)) {
      const inputEl = this.searchInput()?.nativeElement;
      if (inputEl) this.initAutocomplete(inputEl);
    }
  }

  checkForActiveRide() {
    this.rideService.getCurrentRide().subscribe({
      next: (ride) => {
        if (ride && ride.status !== 'COMPLETED' && ride.status !== 'CANCELLED') {
          this.activeRide.set(ride);
          if (ride.driver) this.assignedDriver.set(ride.driver);

          switch (ride.status) {
            case RideStatus.SEARCHING: this.bookingStage.set('searching'); break;
            case RideStatus.ACCEPTED:
            case RideStatus.ARRIVED:
              this.bookingStage.set('confirmed');
              this.resetMapForTrip();
              break;
            case RideStatus.IN_PROGRESS:
              this.bookingStage.set('trip-started');
              this.markers.set([]);
              break;
          }
          this.listenToRideEvents(ride.id);
        }
      },
      error: () => console.log('No active ride to restore.')
    });
  }

  listenToRideEvents(rideId: string) {
    const statusEvent = SOCKET_EVENTS.RIDE_STATUS_UPDATE(rideId);

    this.socketService.listen(statusEvent, (updatedRide: Ride) => {
      this.activeRide.set(updatedRide);

      switch (updatedRide.status) {
        case RideStatus.ACCEPTED:
          if (updatedRide.driver) {
            this.assignedDriver.set(updatedRide.driver);
            this.bookingStage.set('confirmed');
            toast.success('🚖 Driver Found!', { description: `${updatedRide.driver.name} is on the way.` });
            if (this.markers().length === 0) this.resetMapForTrip();
          }
          break;

        case RideStatus.ARRIVED:
          this.bookingStage.set('confirmed');
          // ✅ Premium Sonner Notification
          toast.info('Driver Arrived', { 
            description: 'Your driver is waiting at the pickup point.',
            duration: 8000 
          });
          break;

        case RideStatus.IN_PROGRESS:
          this.bookingStage.set('trip-started');
          toast.success('Trip Started', { description: 'Have a safe journey!' });
          break;

        case RideStatus.COMPLETED:
          this.completedRide.set(updatedRide);
          this.bookingStage.set('summary');
          this.activeRide.set(null);
          this.animator.stopAnimation();
          this.markers.set([]);
          break;

        case RideStatus.CANCELLED:
          this.resetState();
          toast.error('Ride Cancelled', { description: 'The driver cancelled the request.' });
          break;
      }
    });

    const locationEvent = SOCKET_EVENTS.DRIVER_LOCATION_UPDATE(rideId);
    this.socketService.listen(locationEvent, (location: any) => {
      this.driverLocation.set({ lat: location.lat, lng: location.lng });
    });
  }

  getCurrentLocation() {
    if (isPlatformBrowser(this.platformId) && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
          this.sourceLocation = pos;
          this.center.set(pos);
          this.addMarker(pos, 'You');
          const dummyCars = this.mapUtils.generateNearbyCars(pos, this.carIcon);
          this.markers.update(curr => [...curr, ...dummyCars]);
        },
        (error) => console.error('Location Error:', error)
      );
    }
  }

  private addMarker(position: google.maps.LatLngLiteral, title: string) {
    const newMarker: MapMarkerConfig = {
      position, title,
      options: { animation: google.maps.Animation.DROP }
    };
    this.markers.update(current => [...current, newMarker]);
  }

  initAutocomplete(inputElement: HTMLInputElement) {
    if (!google?.maps?.places) return;
    const autocomplete = new google.maps.places.Autocomplete(inputElement, { 
        types: ['establishment', 'geocode'], 
        componentRestrictions: { country: 'IN' } 
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        const destPos = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
        this.center.set(destPos);
        if (this.sourceLocation) this.calculateRoute(this.sourceLocation, destPos);
        else this.addMarker(destPos, 'Destination');
      }
    });
  }

  async calculateRoute(from: google.maps.LatLngLiteral, to: google.maps.LatLngLiteral) {
    try {
      const response = await this.mapUtils.calculateRoute(from, to);
      this.directionsResult.set(response);
      const options = this.mapUtils.estimatePrices(response, this.rideConfigs());
      this.rideOptions.set(options);
    } catch (error) {
      toast.error('Route calculation failed');
    }
  }

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

    // ✅ Signal usage fixed
    this.rideService.requestRide(ridePayload).subscribe({
      next: (ride: Ride) => {
        this.activeRide.set(ride);
        this.listenToRideEvents(ride.id);
      },
      error: () => {
        toast.error('Booking Failed');
        this.bookingStage.set('select-ride');
      }
    });
  }

  submitRating(rating: number) {
    // ✅ No more nuclear options. Sonner handles cleanup automatically.
    toast.success('Thank You!', {
      description: `You rated ${rating} stars.`,
      duration: 3000,
    });
    this.resetUI();
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

    if (confirm('Cancel this ride?')) {
      this.rideService.cancelRide(ride.id).subscribe({
        next: () => {
          this.resetState();
          toast.success('Ride Cancelled');
        },
        error: () => toast.error('Cancellation failed')
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

  // --- Utility ---
  updateDriverMarker(pos: google.maps.LatLngLiteral) {
    this.markers.update(current => {
      const userMarker = current.find(m => m.title === 'You' || m.title === 'Destination');
      const driverMarker: MapMarkerConfig = {
        position: pos, title: 'Your Driver',
        options: { icon: this.carIcon, zIndex: 100 }
      };
      return userMarker ? [userMarker, driverMarker] : [driverMarker];
    });
  }

  resetMapForTrip() {
    this.markers.set([]);
    if (this.sourceLocation) {
      this.addMarker(this.sourceLocation, 'You');
    }
  }

  toggleMenu() { this.isMenuOpen.update(val => !val); }
  
  logout() {
    localStorage.removeItem('uber_token');
    this.router.navigate(['/login']);
  }

  ngOnDestroy() {
    this.socketService.disconnect();
    this.animator.stopAnimation();
  }
}