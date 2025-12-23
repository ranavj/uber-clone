import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiButton } from '@uber/ui'; // Button UI import

@Component({
  selector: 'app-ride-selection',
  standalone: true,
  imports: [CommonModule, UiButton],
  templateUrl: './ride-selection.html',
  styleUrl: './ride-selection.css',
})
export class RideSelection {
  // Parent se data aayega (Cars ki list)
  @Input() options: any[] = [];
  
  // Parent ko batayenge (Konsi car select hui)
  @Output() select = new EventEmitter<string>();

  // Helper method for button click
  onSelect(id: string) {
    this.select.emit(id);
  }
}