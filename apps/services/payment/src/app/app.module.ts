import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WalletService } from './wallet.service';
import { PrismaService } from './prisma.service';
import { StripeService } from './stripe.service';
import { ConfigModule } from '@nestjs/config';
import { WalletController } from './wallet.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [AppController, WalletController],
  providers: [AppService, WalletService, PrismaService, StripeService],
})
export class AppModule {}
