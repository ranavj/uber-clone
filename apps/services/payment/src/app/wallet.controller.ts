import { Controller } from '@nestjs/common';
import { MessagePattern, EventPattern, Payload } from '@nestjs/microservices';
import { WalletService } from './wallet.service';
import { StripeService } from './stripe.service';

@Controller()
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly stripeService: StripeService
  ) {}

  // 1. 🚀 WEBHOOK HANDLER (Gateway se forwarded data)
  @EventPattern('payment.stripe_webhook_received')
  async handleStripeWebhook(@Payload() data: { signature: string; payload: any }) {
    console.log('------------------------------------------------');
    console.log('📩 Payment Service: Webhook event received via TCP');

    try {
      // Buffer conversion zaroori hai signature verification ke liye
      const rawBody = Buffer.from(data.payload);

      // A. Verify Signature
      const event = this.stripeService.constructEventFromPayload(data.signature, rawBody);
      console.log('✅ Webhook Verified. Event:', event.type);

      // B. Success Logic
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as any;
        const userId = paymentIntent.metadata.userId;
        const amount = paymentIntent.amount / 100; // Cents to INR conversion

        console.log(`💰 Success! Adding funds: User ${userId}, Amount ${amount}`);

        // C. Update Database
        await this.walletService.fundWallet(userId, amount, paymentIntent.id);
      }
    } catch (err) {
      console.error('❌ Webhook Processing Failed:', err.message);
    }
  }

  // 👇 Aapke baaki existing patterns (Same rahenge)
  @MessagePattern('payment.process_ride')
  async processPayment(@Payload() data: any) {
    return await this.walletService.processRidePayment(data.rideId, data.riderId, data.driverId, data.amount);
  }

  @MessagePattern('payment.get_balance')
  async getBalance(@Payload() data: { userId: string }) {
    return { balance: await this.walletService.getBalance(data.userId) };
  }

  @MessagePattern('payment.create_intent')
  async createPaymentIntent(@Payload() data: { amount: number; userId: string }) {
    console.log('💳 Creating Payment Intent for:', data);
    return await this.stripeService.createPaymentIntent(data.amount, data.userId);
  }
}