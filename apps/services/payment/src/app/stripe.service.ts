import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  // 👇 Logger add kiya taaki debugging aasaan ho
  private readonly logger = new Logger(StripeService.name);

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2025-12-15.clover' as any, // Version match rakhein
    });
  }

  /**
   * 1. CREATE PAYMENT INTENT
   * Yeh frontend ko ek "Client Secret" dega.
   * @param amount - Amount in Rupees (e.g., 500 for ₹500)
   */
  async createPaymentIntent(amount: number, userId: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amount * 100, // 👈 Important: ₹1 = 100 paise conversion
        currency: this.configService.get('STRIPE_CURRENCY') || 'inr',
        description: 'Wallet Top-up for Uber Clone Service',
        metadata: {
          userId: userId, // Webhook mein yahi ID wapas aayegi
        },
        shipping: {
          name: 'Test User',
          address: {
            line1: '510 Townsend St',
            postal_code: '98140',
            city: 'San Francisco',
            state: 'CA',
            country: 'US',
          },
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      this.logger.log(`✅ Payment Intent Created: ${paymentIntent.id} for User: ${userId}`);

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      this.logger.error(`❌ Stripe Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * 2. VERIFY WEBHOOK SIGNATURE
   */
  constructEventFromPayload(signature: string, payload: Buffer) {
    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}