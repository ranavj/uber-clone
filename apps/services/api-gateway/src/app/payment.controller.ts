import { Body, Controller, Inject, Post, HttpException, HttpStatus, Get, UseGuards, Request, InternalServerErrorException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthGuard } from '@nestjs/passport';
import { firstValueFrom, lastValueFrom } from 'rxjs';

@Controller('payment')
export class PaymentController {
  constructor(
    @Inject('PAYMENT_SERVICE') private readonly paymentClient: ClientProxy
  ) { }

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

  @Get('get_balance')
  @UseGuards(AuthGuard('jwt'))
  async getBalance(@Request() req) {
    const userId = req.user.id;
    return this.paymentClient.send('payment.get_balance', { userId });
  }

  // api-gateway -> payment.controller.ts
  @Post('process-ride')
  @UseGuards(AuthGuard('jwt'))
  async processRidePayment(@Body() data: any) {
    return this.paymentClient.send('payment.process_ride', data);
  }
}