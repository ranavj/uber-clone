import { Body, Controller, Inject, Post, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Controller('payment')
export class PaymentController {
  constructor(
    @Inject('PAYMENT_SERVICE') private readonly paymentClient: ClientProxy
  ) {}

  @Post('create-intent')
  async createPaymentIntent(@Body() body: { amount: number; userId: string }) {
    console.log('🚀 Gateway: Requesting Payment Intent...');
    
    try {
      const result = await lastValueFrom(
        this.paymentClient.send('payment.create_intent', {
          amount: body.amount,
          userId: body.userId || 'test-user-123', // Testing ke liye fallback
        })
      );
      return result;
    } catch (error) {
      console.error('Gateway Error:', error);
      throw new HttpException('Failed to create payment intent', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}