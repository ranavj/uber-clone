import { Component, Input } from '@angular/core';
import { cva, VariantProps } from 'class-variance-authority';
import { cn } from './utils';
// Button ke Styles ka Logic
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-black text-white hover:bg-gray-800 shadow',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
        outline: 'border border-gray-300 bg-transparent hover:bg-gray-100 text-black',
        ghost: 'hover:bg-gray-100 text-black',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-8 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
@Component({
  selector: 'uber-button',
  imports: [],
  template: `<button [class]="computedClass">
      <ng-content></ng-content>
    </button>`,
  styles: ``,
})
export class UiButton {
  @Input() variant: 'default' | 'destructive' | 'outline' | 'ghost' = 'default';
  @Input() size: 'default' | 'sm' | 'lg' = 'default';
  @Input() class = '';
  @Input() disabled = false;
  get computedClass() {
    return cn(buttonVariants({ variant: this.variant, size: this.size }), this.class);
  }
}
