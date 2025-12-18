import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from './utils';

@Component({
  selector: 'uber-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="computedClass">
      
      <div *ngIf="title" class="flex flex-col space-y-1.5 p-6 pb-2">
        <h3 class="text-2xl font-semibold leading-none tracking-tight">{{ title }}</h3>
        <p *ngIf="description" class="text-sm text-gray-500">{{ description }}</p>
      </div>

      <div class="p-6 pt-0">
        <ng-content></ng-content>
      </div>
      
      <div *ngIf="footer" class="flex items-center p-6 pt-0">
        {{ footer }}
      </div>
    </div>
  `,
  styles: [] // Tailwind hai toh style khali rahega
})
export class UiCardComponent {
  @Input() title = '';
  @Input() description = '';
  @Input() footer = '';
  @Input() class = '';

  get computedClass() {
    // Shadcn Style Card Classes
    return cn(
      'rounded-xl border border-gray-200 bg-white text-gray-950 shadow-sm', 
      this.class
    );
  }
}