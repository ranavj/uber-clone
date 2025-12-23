import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Driver } from '@uber-clone/interfaces';

@Component({
  selector: 'app-trip-details',
  imports: [],
  templateUrl: './trip-details.html',
  styleUrl: './trip-details.css',
})
export class TripDetails {
  // Parent se data aayega
  @Input() driver: Driver | null = null;
  @Input() status: string = 'confirmed'; // 'confirmed' ya 'trip-started'
  
  // Parent ko events bhejenge
  @Output() cancel = new EventEmitter<void>();
  @Output() callDriver = new EventEmitter<void>();

  onCancel() {
    this.cancel.emit();
  }

  onCall() {
    this.callDriver.emit();
  }
}
