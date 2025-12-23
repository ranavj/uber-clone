import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MapUtils {

  // 1. ROUTE CALCULATE KARNA
  // Yeh Promise return karta hai taaki hum async/await use kar sakein
  calculateRoute(
    from: google.maps.LatLngLiteral, 
    to: google.maps.LatLngLiteral
  ): Promise<google.maps.DirectionsResult> {
    const directionsService = new google.maps.DirectionsService();

    return new Promise((resolve, reject) => {
      directionsService.route(
        { origin: from, destination: to, travelMode: google.maps.TravelMode.DRIVING },
        (response, status) => {
          if (status === google.maps.DirectionsStatus.OK && response) {
            resolve(response);
          } else {
            reject('Directions request failed: ' + status);
          }
        }
      );
    });
  }

  // 2. PRICE ESTIMATION LOGIC
  // Route ke distance ke hisaab se paise batata hai
  estimatePrices(result: google.maps.DirectionsResult, rideConfigs: any[]) {
    const leg = result.routes[0].legs[0];
    if (!leg || !leg.distance || !leg.duration) return [];

    const distanceKm = leg.distance.value / 1000; // Meters to KM
    const durationText = leg.duration.text;

    return rideConfigs.map(config => ({
      id: config.id,
      name: config.name,
      image: config.image,
      time: durationText,
      // Formula: Base Price + (Price Per KM * Distance)
      price: Math.round(config.basePrice + (config.pricePerKm * distanceKm))
    }));
  }

  // 3. DUMMY CARS GENERATOR
  // User ke aas-paas nakli gaadiyan dikhane ke liye
  generateNearbyCars(center: google.maps.LatLngLiteral, icon: google.maps.Icon) {
    const cars = [];
    for (let i = 0; i < 4; i++) {
      // Thoda sa random position shift
      const lat = center.lat + (Math.random() - 0.5) * 0.01;
      const lng = center.lng + (Math.random() - 0.5) * 0.01;
      
      cars.push({
        position: { lat, lng },
        title: `Uber Driver ${i + 1}`,
        options: { icon: icon }
      });
    }
    return cars;
  }
}