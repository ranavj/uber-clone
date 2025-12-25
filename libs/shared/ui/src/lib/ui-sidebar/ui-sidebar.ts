import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'uber-sidebar',
  imports: [],
  templateUrl: './ui-sidebar.html',
  styleUrl: './ui-sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiSidebar {
  // ✅ Signal Input: Is Sidebar Open?
  isOpen = input.required<boolean>();

  // ✅ Signal Output: Close Event
  close = output<void>();
}
