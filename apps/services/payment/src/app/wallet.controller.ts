import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { WalletService } from './wallet.service';
import { StripeService } from './stripe.service'; // 👈 Import kiya

@Controller()
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly stripeService: StripeService // 👈 Inject kiya
  ) {}

  // 👇 RIDE PAYMENT (Existing)
  @MessagePattern('payment.process_ride')
  async processPayment(@Payload() data: any) {
    return await this.walletService.processRidePayment(data.rideId, data.riderId, data.driverId, data.amount);
  }

  // 👇 ADD FUNDS VIA WEBHOOK (Existing)
  @MessagePattern('payment.add_funds') 
  async addFunds(@Payload() data: { userId: string; amount: number; refId: string }) {
    console.log('💰 Message Received: Adding Funds:', data);
    return await this.walletService.fundWallet(
      data.userId,
      data.amount,
      data.refId
    );
  }

  // 👇 GET BALANCE (Existing)
  @MessagePattern('payment.get_balance')
  async getBalance(@Payload() data: { userId: string }) {
    return { balance: await this.walletService.getBalance(data.userId) };
  }

  // 👇 NEW: CREATE PAYMENT INTENT (Frontend ke liye)
  @MessagePattern('payment.create_intent')
  async createPaymentIntent(@Payload() data: { amount: number; userId: string }) {
    console.log('💳 Creating Payment Intent for:', data);
    return await this.stripeService.createPaymentIntent(data.amount, data.userId);
  }
}