import { 
  Component, 
  AfterViewInit, 
  viewChild, 
  ElementRef, 
  inject, 
  signal, 
  ChangeDetectorRef, 
  NgZone, 
  OnDestroy 
} from '@angular/core';
import { CommonModule } from '@angular/common';
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

@Component({
  selector: 'app-payment-modal',
  templateUrl: './payment.model.html',
  styleUrl: './payment.model.css',
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class PaymentModalComponent implements AfterViewInit, OnDestroy {
  // ✅ viewChild for all containers
  private readonly cardNumberContainer = viewChild<ElementRef>('cardNumber');
  private readonly cardExpiryContainer = viewChild<ElementRef>('cardExpiry');
  private readonly cardCvcContainer = viewChild<ElementRef>('cardCvc');

  private stripe: Stripe | null = null;
  private cardNumber?: StripeCardNumberElement;
  private cardExpiry?: StripeCardExpiryElement; // ✅ New
  private cardCvc?: StripeCardCvcElement;       // ✅ New

  private readonly paymentService = inject(PaymentService);
  private readonly socketService = inject(SocketService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);

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

      // ✅ 1. Create all three elements
      this.cardNumber = elements.create('cardNumber', elementStyles);
      this.cardExpiry = elements.create('cardExpiry', elementStyles);
      this.cardCvc = elements.create('cardCvc', elementStyles);

      // ✅ 2. Mount them properly
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

    this.socketService.listen(SOCKET_EVENTS.WALLET_UPDATE, (data: any) => {
      this.zone.run(() => {
        this.currentBalance.set(data.newBalance);
        this.loading.set(false);
        toast.success(`Wallet Updated: ₹${data.newBalance}`);
        this.cdr.detectChanges();
      });
    });
  }

  async handlePayment() {
    if (this.loading() || !this.stripe || !this.cardNumber) return;

    this.loading.set(true);
    this.cdr.detectChanges();

    // 🎯 Sonner promise handles the UI flow
    toast.promise(this.processPayment(), {
      loading: 'Confirming with Bank...',
      success: () => {
        // ✅ SUCCESS Case: Loading turant false karein taaki button re-enable ho jaye
        this.loading.set(false);
        this.cdr.detectChanges();
        return 'Payment Confirmed! Updating wallet...';
      },
      error: (err: any) => {
        // ❌ ERROR Case: Loading false karein taaki user retry kar sake
        this.loading.set(false);
        this.cdr.detectChanges();
        return err.message || 'Payment Failed';
      },
    });
  }

  private async processPayment() {
    try {
      // 1. Backend se intent lein
      const res: any = await firstValueFrom(this.paymentService.createIntent(this.selectedAmount()));
      
      // 2. Stripe se confirm karein
      const result = await this.stripe!.confirmCardPayment(res.clientSecret, {
        payment_method: { card: this.cardNumber! },
      });

      if (result.error) throw new Error(result.error.message);
      
      return result;
    } catch (error) {
      // Catch block safety ke liye
      this.loading.set(false);
      this.cdr.detectChanges();
      throw error;
    }
  }

  ngOnDestroy() {
    this.socketService.disconnect();
    // ✅ Cleanup elements
    this.cardNumber?.destroy();
    this.cardExpiry?.destroy();
    this.cardCvc?.destroy();
  }
}