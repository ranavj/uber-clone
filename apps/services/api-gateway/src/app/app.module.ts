import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
// 👇 NEW IMPORTS (Auth ke liye)
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { WebhookController } from './webhook.controller';
import { PaymentController } from './payment.controller';
import { AuthController } from './auth.controller';
import { RidesController } from './rides.controller';
import { JwtStrategy } from './auth/jwt.strategy';
import { SocketProxyMiddleware } from './socket-proxy.middleware';
import { createProxyMiddleware } from 'http-proxy-middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    
    // 👇 1. AUTH SETUP (Gateway ko 'Bouncer' banaya)
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret', // Secret match hona chahiye
      signOptions: { expiresIn: '1d' },
    }),
    
    // 👇 2. MICROSERVICES CLIENTS (As it is)
    ClientsModule.register([
      // A. 💰 Payment Service
      {
        name: 'PAYMENT_SERVICE',
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: 4001 },
      },
      // B. 🔐 Auth Service
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: 3002 },
      },
      // C. 🚖 Ride Service
      {
        name: 'RIDE_SERVICE',
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: 3003 },
      },
      // D. 📍 Tracking Service 
      {
        name: 'TRACKING_SERVICE',
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: 3004 },
      },
    ]),
  ],
  controllers: [
    WebhookController, 
    PaymentController, 
    AuthController, 
    RidesController
  ],
  // 👇 3. STRATEGY PROVIDER ADDED
  providers: [JwtStrategy], 
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        createProxyMiddleware({
          target: 'http://127.0.0.1:3013',
          ws: true,
          changeOrigin: true,
        }),
      )
      .forRoutes({
        path: 'socket.io', // 👈 Sirf socket.io requests ke liye
        method: RequestMethod.ALL,
      });
  }
}