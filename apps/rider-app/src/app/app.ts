import { isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HotToastService } from '@ngneat/hot-toast';
import { Subscription, fromEvent } from 'rxjs';
@Component({
  imports: [ RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private toast = inject(HotToastService);
  private offlineSub!: Subscription;
  private onlineSub!: Subscription;
  private platformId = inject(PLATFORM_ID);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      
      // 🔴 Jab Net Chala Jaye (Sirf Browser mein chalega)
      this.offlineSub = fromEvent(window, 'offline').subscribe(() => {
        this.toast.error('You are offline! 🔴', {
          id: 'offline-toast',
          duration: 5000,
          position: 'bottom-center',
          style: { 
            background: '#fee2e2', 
            color: '#dc2626', 
            fontWeight: 'bold' 
          }
        });
      });

      // 🟢 Jab Net Wapas Aaye
      this.onlineSub = fromEvent(window, 'online').subscribe(() => {
        this.toast.success('Back online! 🟢', {
          id: 'online-toast',
          duration: 3000,
          position: 'bottom-center',
          style: { 
            background: '#dcfce7', 
            color: '#166534', 
            fontWeight: 'bold' 
          }
        });
      });
    }
  }

  ngOnDestroy() {
    // Memory leak rokne ke liye unsubscribe zaroori hai
    if (this.offlineSub) this.offlineSub.unsubscribe();
    if (this.onlineSub) this.onlineSub.unsubscribe();
  }
}
