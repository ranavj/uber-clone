import { 
  Controller, 
  Post, 
  Headers, 
  Req, 
  BadRequestException, 
  Inject, 
  RawBodyRequest 
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Request } from 'express';

@Controller('webhook')
export class WebhookController {
  constructor(
    @Inject('PAYMENT_SERVICE') private readonly paymentClient: ClientProxy
  ) {}

  @Post('stripe')
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string, 
    @Req() request: RawBodyRequest<Request>
  ) {
    console.log('------------------------------------------------');
    console.log('🔔 Webhook received at Gateway!');

    // 1. Basic Validation
    if (!signature) {
      console.error('❌ Missing stripe-signature header');
      throw new BadRequestException('Missing signature');
    }

    if (!request.rawBody) {
      console.error('❌ rawBody is missing! Check main.ts bodyParser config.');
      throw new BadRequestException('Raw body not preserved');
    }

    try {
      // 2. 🚀 FORWARD TO PAYMENT SERVICE
      // Hum event verify nahi kar rahe, sirf data emit kar rahe hain taaki Gateway block na ho
      this.paymentClient.emit('payment.stripe_webhook_received', {
        signature: signature,
        payload: request.rawBody, // Yeh Buffer format mein jayega
      });

      console.log('📤 Webhook payload forwarded to Payment Service via TCP');
      
      // 3. Stripe ko 200 OK turant bhej rahe hain
      return { received: true };

    } catch (error) {
      console.error('❌ Failed to forward webhook:', error.message);
      throw new BadRequestException('Webhook forwarding failed');
    }
  }
}