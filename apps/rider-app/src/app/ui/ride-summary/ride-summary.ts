import { Component, input, output, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ride } from '@uber-clone/interfaces';

@Component({
  selector: 'app-ride-summary',
  standalone: true,
  imports: [CommonModule], // CommonModule zaroori hai basic pipes/directives ke liye
  templateUrl: './ride-summary.html',
  styleUrl: './ride-summary.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RideSummary {
  
  // ✅ 1. Signal Input (Required)
  ride = input.required<Ride>();
  
  // ✅ 2. Signal Output
  close = output<number>(); // Ab hum rating bhi wapas bhejenge!

  // ✅ 3. Local State for Rating (Interactive UI)
  rating = signal(5); // Default 5 stars
  stars = [1, 2, 3, 4, 5]; // Loop ke liye helper array

  // ✅ 4. Computed Logic (Maths moved out of HTML)
  // Logic: Total - (Base 40 - Discount 10) = Distance Charge
  distanceCharge = computed(() => {
    const total = this.ride().price || 0;
    const baseWithDiscount = 30; // 40 - 10
    return Math.max(0, total - baseWithDiscount);
  });

  // Rating set karne ke liye
  setRating(star: number) {
    this.rating.set(star);
  }

  onSubmit() {
    // Parent ko batao: Close karo aur yeh rahi rating
    this.close.emit(this.rating());
  }
}