import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UiSidebar } from '@uber/ui';

@Component({
  selector: 'app-driver-sidebar',
  imports: [CommonModule, RouterModule, UiSidebar],
  templateUrl: './driver-sidebar.html',
  styleUrl: './driver-sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DriverSidebar {
  isOpen = input.required<boolean>();

  // ✅ Events Parent ko wapas jayenge
  close = output<void>();
  logout = output<void>();
}
