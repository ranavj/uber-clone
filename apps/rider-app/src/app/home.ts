import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, OnInit, PLATFORM_ID, signal, ViewChild } from '@angular/core';
import { MapMarkerConfig, UiButton, UiMapComponent } from '@uber/ui';

// 👇 Data Structure define kiya
interface RideOption {
  id: string;
  name: string;
  image: string;
  price: number;
  time: string;
}

// 👇 Driver Interface
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
export class Home implements OnInit, AfterViewInit {
  private platformId = inject(PLATFORM_ID);
  
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  center = signal<google.maps.LatLngLiteral>({ lat: 28.6139, lng: 77.2090 });
  markers = signal<MapMarkerConfig[]>([]);
  directionsResult = signal<google.maps.DirectionsResult | null>(null);
  
  rideOptions = signal<RideOption[]>([]);

  bookingStage = signal<'select-ride' | 'searching' | 'confirmed'>('select-ride');
  
  assignedDriver = signal<DriverDetails | null>(null);
  sourceLocation: google.maps.LatLngLiteral | null = null;
  markerOptions: google.maps.MarkerOptions | undefined;

  carIcon: google.maps.Icon = {
    url: 'https://cdn-icons-png.flaticon.com/512/11104/11104431.png',
    scaledSize: { width: 40, height: 40, equals: () => false } as google.maps.Size,
  };

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.markerOptions = {
        draggable: false,
        animation: google.maps.Animation.DROP,
      };
      this.getCurrentLocation();
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initAutocomplete();
    }
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
          
          // 👇 Route aate hi Price calculate karo
          this.updatePrices(response);
          
        } else {
          console.error('Directions request failed due to ' + status);
        }
      }
    );
  }

  // 👇 Price Calculation Logic
  updatePrices(result: google.maps.DirectionsResult) {
    const leg = result.routes[0].legs[0];
    if (!leg || !leg.distance || !leg.duration) return;

    // Distance in Kilometers
    const distanceKm = leg.distance.value / 1000;
    const durationText = leg.duration.text; // e.g., "15 mins"

    // Simple Math: Base Fare + (Rate * Distance)
    const options: RideOption[] = [
      {
        id: 'moto',
        name: 'Uber Moto',
        image: 'https://cdn-icons-png.flaticon.com/512/3721/3721619.png', // Bike Icon
        price: Math.round(20 + (10 * distanceKm)), // ₹10 per km
        time: durationText
      },
      {
        id: 'uber_go',
        name: 'Uber Go',
        image: 'https://cdn-icons-png.flaticon.com/512/11104/11104431.png', // Car Icon
        price: Math.round(40 + (15 * distanceKm)), // ₹15 per km
        time: durationText
      },
      {
        id: 'premier',
        name: 'Uber Premier',
        image: 'https://cdn-icons-png.flaticon.com/512/5035/5035162.png', // Luxury Icon
        price: Math.round(60 + (22 * distanceKm)), // ₹22 per km
        time: durationText
      }
    ];

    this.rideOptions.set(options);
  }

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

  private addMarker(position: google.maps.LatLngLiteral, title: string) {
    const newMarker: MapMarkerConfig = {
      position,
      title,
      options: { animation: google.maps.Animation.DROP }
    };
    this.markers.update(current => [...current, newMarker]);
  }

  requestRide(rideId: string) {
    console.log('Requesting ride:', rideId);
    
    // 1. Stage change -> Searching
    this.bookingStage.set('searching');

    // 2. Simulate Network Delay (3 Seconds)
    setTimeout(() => {
      this.findDriver();
    }, 3000);
  }

  // 👇 Naya Function: Driver Assign karo
  findDriver() {
    // Fake Driver Data
    const driver: DriverDetails = {
      name: 'Vikram Singh',
      carModel: 'Maruti Swift Dzire',
      carNumber: 'DL 3C AB 1234',
      rating: 4.8,
      image: 'https://cdn-icons-png.flaticon.com/512/3048/3048122.png', // Driver Icon
      phone: '+91 9876543210'
    };

    this.assignedDriver.set(driver);
    
    // 3. Stage change -> Confirmed
    this.bookingStage.set('confirmed');
  }
}