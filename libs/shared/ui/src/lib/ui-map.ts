import { Component, Input, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapsModule, MapDirectionsRenderer, MapInfoWindow, MapMarker } from '@angular/google-maps'; // 👈 Official Module
export interface MapMarkerConfig {
  position: google.maps.LatLngLiteral;
  options?: google.maps.MarkerOptions;
  title?: string;
}
@Component({
  selector: 'uber-map',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule, MapMarker, MapDirectionsRenderer], 
  template: `
    @if (apiLoaded()) {
      <google-map
        [height]="height"
        [width]="width"
        [center]="center"
        [zoom]="zoom"
        [options]="options"
      >
        @for (marker of markers; track marker) {
          <map-marker
            [position]="marker.position"
            [options]="marker.options || {}"
            [title]="marker.title || ''"
          ></map-marker>
        }
        @if (directions) {
          <map-directions-renderer [directions]="directions"></map-directions-renderer>
        }
      </google-map>
    } @else {
      <div class="h-full w-full flex items-center justify-center bg-gray-100">
        <p>Loading Map...</p>
      </div>
    }
  `,
  styles: []
})
export class UiMapComponent {
  // Inputs for Customization
  @Input() height = '100%';
  @Input() width = '100%';
  
  // Default Location: Connaught Place, Delhi (Example)
  @Input() center: google.maps.LatLngLiteral = { lat: 28.6139, lng: 77.2090 };
  @Input() zoom = 14;
  @Input() markers: MapMarkerConfig[] = [];
  @Input() directions: google.maps.DirectionsResult | null = null;
  apiLoaded = signal(false);
  // Map Options (UI Clean rakhne ke liye controls hide kar diye)
  options: google.maps.MapOptions = {
    disableDefaultUI: true, // Zoom/Street View buttons hatao (Uber style)
    zoomControl: false,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  };

  constructor() {
    this.checkApiLoad();
  }
  checkApiLoad() {
    if (typeof window !== 'undefined') {
      const interval = setInterval(() => {
        if ((window as any)['google'] && (window as any)['google'].maps) {
          this.apiLoaded.set(true);
          clearInterval(interval);
        }
      }, 100);
      setTimeout(() => clearInterval(interval), 5000);
    }
  }
}