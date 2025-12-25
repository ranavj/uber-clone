import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiButton } from '@uber/ui'; // Button UI import
export interface RideOption {
  id: string;
  name: string;
  image: string;
  price: number;
  time: string;
}
@Component({
  selector: 'app-ride-selection',
  standalone: true,
  imports: [CommonModule, UiButton],
  templateUrl: './ride-selection.html',
  styleUrl: './ride-selection.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RideSelection {
  // ✅ OLD: @Input() options: any[] = [];
  // 🚀 NEW: Signal Input (Required because list ke bina component bekaar hai)
  options = input.required<RideOption[]>(); 

  // ✅ OLD: @Output() select = new EventEmitter<string>();
  // 🚀 NEW: Modern Output Function
  select = output<string>();

  // Helper method
  onSelect(id: string) {
    this.select.emit(id); // Syntax almost same hai
  }
}