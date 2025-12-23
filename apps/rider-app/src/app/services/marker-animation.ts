import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MarkerAnimation {
  // Animation ID store karte hain taaki purani animation rok sakein
  private animationId: number | null = null;

  // 🏁 MAIN ANIMATION FUNCTION
  animateMarker(
    start: google.maps.LatLngLiteral, // Kahan se shuru karna hai
    end: google.maps.LatLngLiteral,   // Kahan jana hai
    duration: number,                 // Kitne time mein (ms)
    onUpdate: (pos: google.maps.LatLngLiteral) => void // Callback (Har frame par nayi position batayega)
  ) {
    const startTime = performance.now();
    
    // Purani animation stop karo taaki collision na ho
    this.stopAnimation();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      
      // Progress 0 se 1 ke beech hoga (0% se 100%)
      const progress = Math.min(elapsed / duration, 1);

      // 🧮 INTERPOLATION FORMULA (Linear)
      // Current = Start + (Difference * Progress)
      const currentLat = start.lat + (end.lat - start.lat) * progress;
      const currentLng = start.lng + (end.lng - start.lng) * progress;
      
      // Nayi position Home Component ko wapas bhejo
      onUpdate({ lat: currentLat, lng: currentLng });

      // Agar abhi manzil nahi aayi, toh agla frame request karo
      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      }
    };

    // Animation start karo
    this.animationId = requestAnimationFrame(animate);
  }

  // 🛑 STOP FUNCTION
  // Component destroy hone par ya nayi update aane par ise call karein
  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}