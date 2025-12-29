import { isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subscription, fromEvent } from 'rxjs';
// ✅ Updated: ngx-sonner static import aur Component import
import { toast, NgxSonnerToaster } from 'ngx-sonner'; 

@Component({
  standalone: true,
  // ✅ Toaster component ko imports mein shamil kiya
  imports: [RouterModule, NgxSonnerToaster], 
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  private offlineSub!: Subscription;
  private onlineSub!: Subscription;
  private platformId = inject(PLATFORM_ID);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      
      // 🔴 Jab Net Chala Jaye (Offline)
      this.offlineSub = fromEvent(window, 'offline').subscribe(() => {
        toast.error('You are offline! 🔴', {
          id: 'connectivity-toast', // Same ID taaki ek hi dikhe
          description: 'Please check your internet connection.',
          duration: 5000,
        });
      });

      // 🟢 Jab Net Wapas Aaye (Online)
      this.onlineSub = fromEvent(window, 'online').subscribe(() => {
        toast.success('Back online! 🟢', {
          id: 'connectivity-toast', // ID match karne se offline wala hat jayega
          description: 'Your connection has been restored.',
          duration: 3000,
        });
      });
    }
  }

  ngOnDestroy() {
    // Memory leak rokne ke liye unsubscribe
    if (this.offlineSub) this.offlineSub.unsubscribe();
    if (this.onlineSub) this.onlineSub.unsubscribe();
  }
}