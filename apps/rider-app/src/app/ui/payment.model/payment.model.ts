import {
  Component,
  AfterViewInit,
  viewChild,
  ElementRef,
  inject,
  signal,
  ChangeDetectorRef,
  NgZone,
  OnDestroy,
  PLATFORM_ID // ✅ Added
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { toast } from 'ngx-sonner';

import {
  loadStripe,
  Stripe,
  StripeCardNumberElement,
  StripeCardExpiryElement,
  StripeCardCvcElement
} from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';
import { PaymentService } from '../../services/payment.service';
import { SocketService } from '@uber-clone/socket-client';
import { SOCKET_EVENTS } from '@uber-clone/interfaces';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment-modal',
  templateUrl: './payment.model.html',
  styleUrl: './payment.model.css',
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class PaymentModalComponent implements AfterViewInit, OnDestroy {
  private readonly cardNumberContainer = viewChild<ElementRef>('cardNumber');
  private readonly cardExpiryContainer = viewChild<ElementRef>('cardExpiry');
  private readonly cardCvcContainer = viewChild<ElementRef>('cardCvc');

  private stripe: Stripe | null = null;
  private cardNumber?: StripeCardNumberElement;
  private cardExpiry?: StripeCardExpiryElement;
  private cardCvc?: StripeCardCvcElement;

  private readonly paymentService = inject(PaymentService);
  private readonly socketService = inject(SocketService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID); // ✅ FIX: Added Injection

  loading = signal(false);
  currentBalance = signal(0);
  selectedAmount = signal(500);

  async ngAfterViewInit() {
    this.stripe = await loadStripe(environment.stripePublicKey);
    this.socketService.connect();

    if (this.stripe) {
      const elements = this.stripe.elements();
      const elementStyles = {
        style: {
          base: {
            fontSize: '16px',
            color: '#1a1a1a',
            '::placeholder': { color: '#aab7c4' },
          },
          invalid: { color: '#dc2626' },
        }
      };

      this.cardNumber = elements.create('cardNumber', elementStyles);
      this.cardExpiry = elements.create('cardExpiry', elementStyles);
      this.cardCvc = elements.create('cardCvc', elementStyles);

      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          this.zone.run(() => {
            if (this.cardNumberContainer()?.nativeElement) {
              this.cardNumber?.mount(this.cardNumberContainer()!.nativeElement);
              this.cardExpiry?.mount(this.cardExpiryContainer()!.nativeElement);
              this.cardCvc?.mount(this.cardCvcContainer()!.nativeElement);
            }
            this.cdr.detectChanges();
          });
        }, 150);
      });
    }

    // ✅ Socket Listener: Step 4
    this.socketService.listen(SOCKET_EVENTS.WALLET_UPDATE, (data: any) => {
      this.zone.run(() => {
        console.log('💰 Socket Event: Wallet Updated', data.newBalance);
        this.currentBalance.set(data.newBalance);
        this.loading.set(false);
        this.cdr.detectChanges();
        
        // Agar handlePayment wala toast abhi tak hai, toh ye naya dikhayega
        toast.success(`Wallet Updated: ₹${data.newBalance}`);
      });
    });
  }

  async handlePayment() {
    if (this.loading() || !this.stripe || !this.cardNumber) return;

    this.loading.set(true);
    this.cdr.detectChanges();

    toast.promise(this.processPayment(), {
      loading: 'Confirming with Bank...',
      success: () => {
        this.loading.set(false);
        this.cdr.detectChanges();

        // 🎯 Step 5: Redirect Failsafe (If Socket is slow or fails)
        setTimeout(() => {
          this.zone.run(() => {
            this.performRedirect();
          });
        }, 3000); // 3 seconds buffer

        return 'Payment Confirmed! Updating wallet...';
      },
      error: (err: any) => {
        this.loading.set(false);
        this.cdr.detectChanges();
        return err.message || 'Payment Failed';
      },
    });
  }

  private async processPayment() {
    try {
      const res: any = await firstValueFrom(this.paymentService.createIntent(this.selectedAmount()));
      const result = await this.stripe!.confirmCardPayment(res.clientSecret, {
        payment_method: { card: this.cardNumber! },
      });

      if (result.error) throw new Error(result.error.message);
      return result;
    } catch (error) {
      this.loading.set(false);
      this.cdr.detectChanges();
      throw error;
    }
  }

  private performRedirect() {
    console.log('🚀 Redirecting to Home...');
    if (isPlatformBrowser(this.platformId)) {
      this.router.navigate(['/'], { replaceUrl: true }).then((navigated) => {
        if (!navigated) {
          window.location.href = '/'; // Nuclear fallback
        }
        this.cdr.detectChanges();
      });
    }
  }

  ngOnDestroy() {
    this.socketService.disconnect();
    this.cardNumber?.destroy();
    this.cardExpiry?.destroy();
    this.cardCvc?.destroy();
  }
}