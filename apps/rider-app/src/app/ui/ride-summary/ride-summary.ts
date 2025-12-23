import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Ride } from '@uber-clone/interfaces';

@Component({
  selector: 'app-ride-summary',
  imports: [],
  templateUrl: './ride-summary.html',
  styleUrl: './ride-summary.css',
})
export class RideSummary {
  // Completed Ride Data
  @Input() ride: Ride | null = null;
  
  // Event jab user "Pay & Close" dabaye
  @Output() close = new EventEmitter<void>();

  onSubmit() {
    this.close.emit();
  }
}
