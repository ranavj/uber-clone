import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices'; // 👈 Import for TCP communication
import { PrismaService } from './prisma.service';

// Enums humare schema ke hisaab se
enum TxType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

enum TxCategory {
  RIDE_PAYMENT = 'RIDE_PAYMENT',
  RIDE_EARNING = 'RIDE_EARNING',
  WALLET_TOPUP = 'WALLET_TOPUP'
}

enum TxStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
    // 📢 RIDE_SERVICE inject kiya taaki socket notification trigger ho sake
    @Inject('RIDE_SERVICE') private readonly rideClient: ClientProxy 
  ) {}

  /**
   * 🔒 CORE LOGIC: Process Ride Payment
   * (Ismein badlav nahi kiya, yeh atomic transaction hai)
   */
  async processRidePayment(rideId: string, riderId: string, driverId: string, amount: number) {
    return await this.prisma.$transaction(async (tx) => {
      const riderWallet = await tx.wallet.findUnique({ where: { userId: riderId } });
      if (!riderWallet) throw new NotFoundException('Rider wallet not found');
      if (riderWallet.balance < amount) {
        throw new BadRequestException(`Insufficient balance. Required: ${amount}`);
      }

      let driverWallet = await tx.wallet.findUnique({ where: { driverId: driverId } });
      if (!driverWallet) {
        driverWallet = await tx.wallet.create({ data: { driverId: driverId, balance: 0 } });
      }

      await tx.wallet.update({ where: { id: riderWallet.id }, data: { balance: riderWallet.balance - amount } });
      await tx.wallet.update({ where: { id: driverWallet.id }, data: { balance: driverWallet.balance + amount } });

      await tx.transaction.create({
        data: {
          walletId: riderWallet.id,
          amount,
          type: TxType.DEBIT,
          category: TxCategory.RIDE_PAYMENT,
          status: TxStatus.SUCCESS,
          rideId,
          description: `Paid for ride #${rideId}`,
        },
      });

      await tx.transaction.create({
        data: {
          walletId: driverWallet.id,
          amount,
          type: TxType.CREDIT,
          category: TxCategory.RIDE_EARNING,
          status: TxStatus.SUCCESS,
          rideId,
          description: `Earnings for ride #${rideId}`,
        },
      });

      return { status: 'SUCCESS', message: 'Payment processed' };
    });
  }

  async getBalance(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    return wallet ? wallet.balance : 0;
  }

  async createWallet(userId: string) {
    return await this.prisma.wallet.create({ data: { userId, balance: 0 } });
  }

  /**
   * 💰 TOP-UP WALLET (UPDATED)
   * Yeh function database update karne ke baad TCP event emit karega.
   */
  async fundWallet(userId: string, amount: number, transactionRef: string) {
    const updatedWallet = await this.prisma.$transaction(async (tx) => {
      let wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) {
        wallet = await tx.wallet.create({ data: { userId, balance: 0 } });
      }

      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: wallet.balance + amount },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: TxType.CREDIT,
          category: TxCategory.WALLET_TOPUP,
          status: TxStatus.SUCCESS,
          externalId: transactionRef,
          description: 'Wallet Top-up via Gateway',
        },
      });

      return updated;
    });

    // 🚀 NEW: Ride Service (Gateway) ko signal bhejo taaki socket update trigger ho
    console.log(`📢 Emitting wallet notification for user: ${userId}`);
    this.rideClient.emit('notify.wallet_update', {
      userId,
      newBalance: updatedWallet.balance
    });

    return updatedWallet;
  }
}