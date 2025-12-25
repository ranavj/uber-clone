import { Component, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-searching-loader',
  standalone: true,
  imports: [],
  templateUrl: './searching-loader.html',
  styleUrl: './searching-loader.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchingLoader {
  
  // ✅ Modern Output Signal
  cancel = output<void>();

  onCancel() {
    this.cancel.emit();
  }
}