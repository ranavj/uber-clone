import { Controller, Post, Headers, Req, BadRequestException, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs'; 
import Stripe from 'stripe';

@Controller('webhook')
export class WebhookController {
  private stripe: Stripe;

  constructor(
    @Inject('PAYMENT_SERVICE') private readonly paymentClient: ClientProxy
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover' as any,
    });
  }

  @Post('stripe')
  async handleStripeWebhook(@Headers('stripe-signature') signature: string, @Req() request: any) {
    console.log('------------------------------------------------');
    console.log('🔔 Webhook received!');
    
    // Debug Logs (Optional: Ab hata bhi sakte ho agar chaho)
    // console.log(`🔍 Signature Length: ${signature ? signature.length : 'MISSING'}`);

    if (!signature) throw new BadRequestException('Missing signature');

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        request.rawBody, 
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      console.log('✅ Signature Verified. Event Type:', event.type);
    } catch (err) {
      console.error(`❌ CRITICAL ERROR: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    // ✅ Payment Logic
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // 🔄 UPDATE: Real User ID Metadata se lo. 
        // Agar Metadata khali hai (Stripe CLI Test), toh 'test-user-123' use karo.
        const userId = paymentIntent.metadata.userId || 'test-user-123'; 
        const amount = paymentIntent.amount;

        console.log(`🚀 Processing Payment for User: ${userId}, Amount: ${amount}`);

        try {
          // 📡 Send Message to Payment Service
          const result = await lastValueFrom(
            this.paymentClient.send('payment.add_funds', {
              userId,
              amount,
              refId: paymentIntent.id,
            })
          );
          
          console.log('✅ Payment Service Response (Wallet Updated):', result);
        } catch (error) {
          console.error('❌ Failed to talk to Payment Service:', error.message);
        }
    } else {
      console.log(`ℹ️ Ignoring event type: ${event.type}`);
    }

    return { received: true };
  }
}