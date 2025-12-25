import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common'; // CommonModule for pipes/directives
import { Driver } from '@uber-clone/interfaces';

@Component({
  selector: 'app-trip-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trip-details.html',
  styleUrl: './trip-details.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TripDetails {
  
  // ✅ Signal Inputs
  driver = input<Driver | null>(null);
  status = input.required<string>(); // 'confirmed' | 'trip-started'
  
  // ✅ Signal Outputs
  cancel = output<void>();
  callDriver = output<void>();

  // ✅ Computed Signals (HTML Logic moved to TS)
  // Logic: Status ke hisab se Title kya hoga?
  titleText = computed(() => 
    this.status() === 'confirmed' ? 'Driver Arriving' : 'Trip in Progress 🚀'
  );

  // Logic: Status ke hisab se Subtitle kya hoga?
  subtitleText = computed(() => 
    this.status() === 'confirmed' ? 'Pickup in 3 mins' : 'On the way to destination'
  );

  // Logic: Kya Cancel button dikhana hai? (Sirf confirmed state mein)
  showCancelButton = computed(() => this.status() === 'confirmed');

  // Helper Methods for Buttons
  onCancel() {
    this.cancel.emit();
  }

  onCall() {
    this.callDriver.emit();
  }
}