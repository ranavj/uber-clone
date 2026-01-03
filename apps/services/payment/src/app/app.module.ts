import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WalletService } from './wallet.service';
import { PrismaService } from './prisma.service';
import { StripeService } from './stripe.service';
import { ConfigModule } from '@nestjs/config';
import { WalletController } from './wallet.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClientsModule.register([
      {
        name: 'RIDE_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 3003, // 👈 Ride Service ka port
        },
      },
    ]),
  ],
  controllers: [AppController, WalletController],
  providers: [AppService, WalletService, PrismaService, StripeService],
})
export class AppModule {}
