import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, OnInit, OnDestroy, PLATFORM_ID, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

// Services
import { RideService } from './services/ride.services';
import { Auth } from './services/auth';
import { SocketService } from '@uber-clone/socket-client';
// UI Components
import { MapMarkerConfig, UiButton, UiMapComponent } from '@uber/ui';
import { Meta, Title } from '@angular/platform-browser';

// ✅ NEW: Import Shared Interfaces
import { Ride, Driver, RideStatus, SOCKET_EVENTS } from '@uber-clone/interfaces';

// Local Interface for UI Display (List of Ride Types)
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
  imports: [CommonModule, UiMapComponent, UiButton],
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

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  // --- SIGNALS (State Management) ---
  center = signal<google.maps.LatLngLiteral>({ lat: 28.6139, lng: 77.2090 });
  markers = signal<MapMarkerConfig[]>([]);
  directionsResult = signal<google.maps.DirectionsResult | null>(null);
  rideOptions = signal<RideOption[]>([]);

  // Stages
  bookingStage = signal<'select-ride' | 'searching' | 'confirmed' | 'trip-started' | 'summary'>('select-ride');

  // ✅ TYPE SAFETY APPLIED HERE
  assignedDriver = signal<Driver | null>(null); // Ab Driver interface use hoga
  completedRide = signal<Ride | null>(null);    // Ab Ride interface use hoga

  // Class Variables
  sourceLocation: google.maps.LatLngLiteral | null = null;
  carIcon: google.maps.Icon = {
    url: 'https://cdn-icons-png.flaticon.com/512/11104/11104431.png',
    scaledSize: { width: 40, height: 40, equals: () => false } as google.maps.Size,
  };

  private currentCarPos: google.maps.LatLngLiteral | null = null;
  private driverAnimationId: number | null = null;
  private animationFrameId: number | null = null;
  rideConfigs: any[] = [];

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.getCurrentLocation();
    }
    
    this.socketService.connect();
    
    this.rideService.getRideTypes().subscribe(configs => {
      console.log('✅ Ride Config Loaded:', configs);
      this.rideConfigs = configs;
    });

    this.rideService.getInitialLocation().subscribe(serverLoc => {
      // 🛡️ Safety Check
      if (serverLoc && serverLoc.lat && serverLoc.lng) {
        
        // Meta Tags Logic
        const pageTitle = `Book Uber in ${serverLoc.city} | Fast & Affordable`;
        this.title.setTitle(pageTitle);
        this.meta.updateTag({ name: 'description', content: `Get a ride in ${serverLoc.city}...` });
        this.meta.updateTag({ property: 'og:title', content: pageTitle });
        
        // Timeout for ExpressionChanged Error
        setTimeout(() => {
          if (!this.sourceLocation) {
            this.center.set({ lat: serverLoc.lat, lng: serverLoc.lng });
          }
        }, 0);
      }
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initAutocomplete();
    }
  }

  // --- MAP & LOCATION LOGIC ---
  getCurrentLocation() {
    if (isPlatformBrowser(this.platformId) && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
          this.sourceLocation = pos;
          this.center.set(pos);
          this.addMarker(pos, 'You are here');
          this.simulateNearbyDrivers(pos);
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

  simulateNearbyDrivers(center: google.maps.LatLngLiteral) {
    const dummyCars: MapMarkerConfig[] = [];
    for (let i = 0; i < 4; i++) {
      const lat = center.lat + (Math.random() - 0.5) * 0.01;
      const lng = center.lng + (Math.random() - 0.5) * 0.01;
      dummyCars.push({
        position: { lat, lng },
        title: `Uber Driver ${i + 1}`,
        options: { icon: this.carIcon }
      });
    }
    this.markers.update(curr => [...curr, ...dummyCars]);
  }

  initAutocomplete() {
    if (!google || !google.maps || !google.maps.places) return;
    const autocomplete = new google.maps.places.Autocomplete(this.searchInput.nativeElement, { types: ['establishment', 'geocode'], componentRestrictions: { country: 'IN' } });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const destPos = { lat, lng };

        this.center.set(destPos);
        if (this.sourceLocation) {
          this.calculateRoute(this.sourceLocation, destPos);
        } else {
          this.addMarker(destPos, 'Destination');
        }
      }
    });
  }

  calculateRoute(from: google.maps.LatLngLiteral, to: google.maps.LatLngLiteral) {
    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      { origin: from, destination: to, travelMode: google.maps.TravelMode.DRIVING },
      (response, status) => {
        if (status === google.maps.DirectionsStatus.OK && response) {
          this.directionsResult.set(response);
          this.updatePrices(response);
        } else {
          console.error('Directions request failed due to ' + status);
        }
      }
    );
  }

  updatePrices(result: google.maps.DirectionsResult) {
    const leg = result.routes[0].legs[0];
    if (!leg || !leg.distance || !leg.duration) return;

    const distanceKm = leg.distance.value / 1000;
    const durationText = leg.duration.text;

    const options = this.rideConfigs.map(config => ({
      id: config.id,
      name: config.name,
      image: config.image,
      time: durationText,
      price: Math.round(config.basePrice + (config.pricePerKm * distanceKm))
    }));
    this.rideOptions.set(options);
  }

  // --- 🚕 BOOKING LOGIC (Using Interfaces) ---

  requestRide(rideId: string) {
    console.log('Requesting ride:', rideId);
    const user = this.authService.currentUser();
    if (!user) {
      alert('Please Login first');
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

    // ✅ NOTE: rideService should return Observable<Ride>
    this.rideService.requestRide(ridePayload).subscribe({
      next: (ride: Ride) => { // 👈 Type Safe Ride
        console.log('✅ Ride Booked! ID:', ride.id);

        // 1. STATUS LISTENER (Using Constants)
        const statusEvent = SOCKET_EVENTS.RIDE_STATUS_UPDATE(ride.id);
        
        this.socketService.listen(statusEvent, (updatedRide: Ride) => {
          console.log('🔔 Status Update:', updatedRide.status);

          // ✅ Using Enum for Status Check
          switch (updatedRide.status) {
            case RideStatus.ACCEPTED:
              // Backend se driver aana chahiye, but for now mocking if missing
              if(updatedRide.driver) {
                  this.assignedDriver.set(updatedRide.driver);
                  this.bookingStage.set('confirmed');
              } else {
                  this.handleMockDriverFound(); // Fallback for testing
              }
              break;
              
            case RideStatus.ARRIVED:
              alert('🚖 Driver Arrived at Pickup!');
              break;
              
            case RideStatus.IN_PROGRESS:
              this.bookingStage.set('trip-started');
              break;
              
            case RideStatus.COMPLETED:
              this.completedRide.set(updatedRide);
              this.bookingStage.set('summary');
              if (this.driverAnimationId) cancelAnimationFrame(this.driverAnimationId);
              break;
          }
        });

        // 2. LIVE TRACKING LISTENER
        const locationEvent = SOCKET_EVENTS.DRIVER_LOCATION_UPDATE(ride.id);
        
        this.socketService.listen(locationEvent, (location: any) => {
          const newPos = { lat: location.lat, lng: location.lng };
          if (!this.currentCarPos) {
            this.currentCarPos = newPos;
            this.updateDriverMarker(newPos);
          } else {
            this.animateMarkerTo(this.currentCarPos, newPos, 1000);
          }
        });
      },
      error: (err) => {
        console.error('Booking Failed', err);
        alert('Booking Failed!');
        this.bookingStage.set('select-ride');
      }
    });
  }

  // Fallback Mock Driver (Testing only)
  handleMockDriverFound() {
    const driver: Driver = {
      id: 'driver-mock-1',
      name: 'Vikram Singh',
      email: 'driver@test.com',
      phone: '+91 9876543210',
      carModel: 'Maruti Swift',
      carNumber: 'DL 3C AB 1234',
      carType: 'uber_go',
      rating: 4.8,
      isOnline: true
    };

    this.assignedDriver.set(driver);
    this.bookingStage.set('confirmed');
    this.resetMapForTrip();
  }

  resetMapForTrip() {
    // Clear Markers & Show Initial Animation
    this.markers.set([]);
    if (this.sourceLocation) {
      this.addMarker(this.sourceLocation, 'You');
      // Mock Start for initial visual
      const mockDriverStart = {
        lat: this.sourceLocation.lat + 0.01,
        lng: this.sourceLocation.lng + 0.01
      };
      this.animateCar(mockDriverStart, this.sourceLocation);
    }
  }

  // --- ANIMATION ENGINES ---
  animateMarkerTo(start: google.maps.LatLngLiteral, end: google.maps.LatLngLiteral, duration: number) {
    const startTime = performance.now();
    if (this.driverAnimationId) cancelAnimationFrame(this.driverAnimationId);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentLat = start.lat + (end.lat - start.lat) * progress;
      const currentLng = start.lng + (end.lng - start.lng) * progress;
      const intermediatePos = { lat: currentLat, lng: currentLng };

      this.updateDriverMarker(intermediatePos);
      this.currentCarPos = intermediatePos;

      if (progress < 1) this.driverAnimationId = requestAnimationFrame(animate);
    };
    this.driverAnimationId = requestAnimationFrame(animate);
  }

  animateCar(start: google.maps.LatLngLiteral, end: google.maps.LatLngLiteral) {
    let progress = 0;
    const speed = 0.005;
    const animate = () => {
      progress += speed;
      if (progress >= 1) {
        this.updateDriverMarker(end);
        return;
      }
      const currentLat = start.lat + (end.lat - start.lat) * progress;
      const currentLng = start.lng + (end.lng - start.lng) * progress;
      this.updateDriverMarker({ lat: currentLat, lng: currentLng });
      this.animationFrameId = requestAnimationFrame(animate);
    };
    animate();
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

  // --- RESET & CLEANUP ---
  submitRating() {
    alert('Thanks for rating! 🌟');
    this.resetUI();
  }

  resetUI() {
    this.bookingStage.set('select-ride');
    this.markers.set([]);
    this.assignedDriver.set(null);
    this.directionsResult.set(null);
    this.rideOptions.set([]);
    this.completedRide.set(null);
    if (this.sourceLocation) {
      this.addMarker(this.sourceLocation, 'You');
      this.center.set(this.sourceLocation);
    }
  }

  ngOnDestroy() {
    this.socketService.disconnect();
    if (this.driverAnimationId) cancelAnimationFrame(this.driverAnimationId);
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
  }
}