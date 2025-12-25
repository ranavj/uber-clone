import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UiSidebar } from '@uber/ui';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-rider-sidebar',
  imports: [CommonModule, RouterModule, UiSidebar],
  templateUrl: './rider-sidebar.html',
  styleUrl: './rider-sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RiderSidebar {
  public auth = inject(Auth);
  // ✅ State from Parent
  isOpen = input.required<boolean>();

  // ✅ Events to Parent
  close = output<void>();
  logout = output<void>();
}
