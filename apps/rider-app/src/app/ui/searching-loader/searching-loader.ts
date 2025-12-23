import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-searching-loader',
  imports: [],
  templateUrl: './searching-loader.html',
  styleUrl: './searching-loader.css',
})
export class SearchingLoader {
  @Output() cancel = new EventEmitter<void>();

  onCancel() {
    this.cancel.emit();
  }
}
