import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, OnInit, OnDestroy, PLATFORM_ID, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

// Services


// UI Components
import { MapMarkerConfig, UiButton, UiMapComponent } from '@uber/ui';
import { RideService } from './services/ride.services';
import { Auth } from './services/auth';
import { SocketService } from './services/socket';

// Interfaces
interface RideOption {
  id: string;
  name: string;
  image: string;
  price: number;
  time: string;
}

interface DriverDetails {
  name: string;
  carModel: string;
  carNumber: string;
  rating: number;
  image: string;
  phone: string;
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

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  // Signals (State Management)
  center = signal<google.maps.LatLngLiteral>({ lat: 28.6139, lng: 77.2090 });
  markers = signal<MapMarkerConfig[]>([]);
  directionsResult = signal<google.maps.DirectionsResult | null>(null);

  rideOptions = signal<RideOption[]>([]);

  // Stages: 'select-ride' -> 'searching' -> 'confirmed' (Driver Found)
  bookingStage = signal<'select-ride' | 'searching' | 'confirmed'>('select-ride');

  assignedDriver = signal<DriverDetails | null>(null);
  private animationFrameId: number | null = null;
  // Class Variables
  sourceLocation: google.maps.LatLngLiteral | null = null;
  carIcon: google.maps.Icon = {
    url: 'https://cdn-icons-png.flaticon.com/512/11104/11104431.png',
    scaledSize: { width: 40, height: 40, equals: () => false } as google.maps.Size,
  };

  ngOnInit() {
    // 1. Browser Check & Location
    if (isPlatformBrowser(this.platformId)) {
      this.getCurrentLocation();
    }

    // 2. Socket Connection
    this.socketService.connect();
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initAutocomplete();
    }
  }

  

  // Map & Location Logic ---

  getCurrentLocation() {
    if (isPlatformBrowser(this.platformId) && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
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

    const autocomplete = new google.maps.places.Autocomplete(
      this.searchInput.nativeElement,
      { types: ['establishment', 'geocode'], componentRestrictions: { country: 'IN' } }
    );

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

    const options: RideOption[] = [
      {
        id: 'moto',
        name: 'Uber Moto',
        image: 'https://cdn-icons-png.flaticon.com/512/3721/3721619.png',
        price: Math.round(20 + (10 * distanceKm)),
        time: durationText
      },
      {
        id: 'uber_go',
        name: 'Uber Go',
        image: 'https://cdn-icons-png.flaticon.com/512/11104/11104431.png',
        price: Math.round(40 + (15 * distanceKm)),
        time: durationText
      },
      {
        id: 'premier',
        name: 'Uber Premier',
        image: 'https://cdn-icons-png.flaticon.com/512/5035/5035162.png',
        price: Math.round(60 + (22 * distanceKm)),
        time: durationText
      }
    ];

    this.rideOptions.set(options);
  }

  // --- 🚕 Booking Logic (The Real Deal) ---

  requestRide(rideId: string) {
    console.log('Requesting ride:', rideId);

    const user = this.authService.currentUser();
    if (!user) {
      alert('Please Login first');
      this.router.navigate(['/login']);
      return;
    }

    // 1. UI Update -> Searching
    this.bookingStage.set('searching');

    // 2. Prepare Payload
    const ridePayload = {
      pickupLat: this.sourceLocation?.lat || 28.6139,
      pickupLng: this.sourceLocation?.lng || 77.2090,
      dropLat: this.center().lat, // Destination
      dropLng: this.center().lng,
      pickupAddr: "Current Location",
      dropAddr: "Destination",
      price: 150, // Should be dynamic based on selection, simplified for now
      riderId: user.id
    };

    // 3. API Call
    this.rideService.requestRide(ridePayload).subscribe({
      next: (ride) => {
        console.log('✅ Ride Booked! ID:', ride.id);

        // 4. Listen for Driver (Socket)
        this.socketService.listen(`ride-status-${ride.id}`, (updatedRide: any) => {
          console.log('🔔 SOCKET UPDATE:', updatedRide.status);

          if (updatedRide.status === 'ACCEPTED') {
            this.handleDriverFound(updatedRide);
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

  handleDriverFound(updatedRide: any) {
    // 1. Backend se Driver ID aayi hai, Mock Details for now
    const driver: DriverDetails = {
      name: 'Vikram Singh',
      carModel: 'Maruti Swift',
      carNumber: 'DL 3C AB 1234',
      rating: 4.8,
      image: 'https://cdn-icons-png.flaticon.com/512/3048/3048122.png',
      phone: '+91 9876543210'
    };

    // 2. Update UI
    this.assignedDriver.set(driver);
    this.bookingStage.set('confirmed'); // ✅ Matches HTML condition
    // Hum maan lete hain jo pehli dummy car thi, wahi driver hai
    const driverStartPos = this.markers()[0].position; 
    
    // Clear all markers first
    this.markers.set([]); 

    // Add User Marker back
    if (this.sourceLocation) {
      this.addMarker(this.sourceLocation, 'You');
    }

    // 3. 🏁 Animation Start Karo!
    if (this.sourceLocation) {
      this.animateCar(driverStartPos, this.sourceLocation);
    }
  }

  // 🏎️ The Animation Logic (Linear Interpolation)
  animateCar(start: google.maps.LatLngLiteral, end: google.maps.LatLngLiteral) {
    let progress = 0;
    const speed = 0.005; // Jitna chhota number, utni slow car chalegi

    const animate = () => {
      progress += speed;

      // Agar car pahunch gayi
      if (progress >= 1) {
        this.updateDriverMarker(end); // Final position set karo
        console.log('🚖 Driver Arrived!');
        return;
      }

      // Current Position calculate karo (Maths magic)
      const currentLat = start.lat + (end.lat - start.lat) * progress;
      const currentLng = start.lng + (end.lng - start.lng) * progress;
      
      const currentPos = { lat: currentLat, lng: currentLng };

      // Marker update karo
      this.updateDriverMarker(currentPos);

      // Agla frame request karo (Smooth loop)
      this.animationFrameId = requestAnimationFrame(animate);
    };

    animate();
  }
  // Helper to update just the driver marker
  updateDriverMarker(pos: google.maps.LatLngLiteral) {
    // Hum markers array update karenge taaki UI refresh ho
    // Note: Isme thoda performance hit ho sakta hai signals ke saath, 
    // par demo ke liye perfect hai.
    
    this.markers.update(current => {
      // Sirf User ka marker rakho, Driver ka naya add karo
      const userMarker = current.find(m => m.title === 'You');
      
      const driverMarker: MapMarkerConfig = {
        position: pos,
        title: 'Your Driver',
        options: { 
            icon: this.carIcon,
            zIndex: 100 // Driver hamesha upar dikhe
        } 
      };

      return userMarker ? [userMarker, driverMarker] : [driverMarker];
    });
  }
  ngOnDestroy() {
    this.socketService.disconnect();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
  
}