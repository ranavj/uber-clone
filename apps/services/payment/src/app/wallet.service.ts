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
  ) { }

  /**
   * 🔒 CORE LOGIC: Process Ride Payment
   * (Ismein badlav nahi kiya, yeh atomic transaction hai)
   */
  // apps/payment-service/src/app/wallet.service.ts

  async processRidePayment(rideId: string, riderId: string, driverId: string, amount: number) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Rider Wallet Check/Create
        let riderWallet = await tx.wallet.findUnique({ where: { userId: riderId } });
        if (!riderWallet) {
          riderWallet = await tx.wallet.create({ data: { userId: riderId, balance: 0 } });
        }

        if (riderWallet.balance < amount) {
          throw new Error(`Insufficient balance. Available: ₹${riderWallet.balance}`);
        }

        // Driver Wallet Check/Create
        let driverWallet = await tx.wallet.findUnique({ where: { driverId: driverId } });
        if (!driverWallet) {
          driverWallet = await tx.wallet.create({ data: { driverId: driverId, balance: 0 } });
        }

        // Atomic Balance Updates
        const updatedRider = await tx.wallet.update({
          where: { id: riderWallet.id },
          data: { balance: { decrement: amount } }
        });

        const updatedDriver = await tx.wallet.update({
          where: { id: driverWallet.id },
          data: { balance: { increment: amount } }
        });

        // Transaction Logs
        await tx.transaction.createMany({
          data: [
            { walletId: riderWallet.id, amount, type: 'DEBIT', category: 'RIDE_PAYMENT', status: 'SUCCESS', rideId },
            { walletId: driverWallet.id, amount, type: 'CREDIT', category: 'RIDE_EARNING', status: 'SUCCESS', rideId }
          ]
        });

        return { riderBalance: updatedRider.balance, driverBalance: updatedDriver.balance };
      });

      // 🚀 REAL-TIME NOTIFICATION (Transaction ke bahar)
      // Rider ko notify karein (userId based room)
      this.rideClient.emit('notify.wallet_update', {
        userId: riderId,
        newBalance: result.riderBalance
      });

      // Driver ko notify karein (driverId based room)
      this.rideClient.emit('notify.wallet_update', {
        userId: driverId,
        newBalance: result.driverBalance
      });

      return { status: 'SUCCESS', message: 'Payment processed' };
    } catch (error) {
      console.error('❌ Payment Failed:', error.message);
      throw new BadRequestException(error.message);
    }
  }

  async getBalance(id: string) {
    console.log('🔍 Database Lookup for ID:', id);

    // 🎯 FIX: Dono fields check karein (OR condition)
    const wallet = await this.prisma.wallet.findFirst({
      where: {
        OR: [
          { userId: id },
          { driverId: id }
        ]
      }
    });

    if (!wallet) {
      console.warn(`⚠️ No wallet found for ID: ${id}. Returning 0.`);
      return 0;
    }

    console.log(`✅ Wallet found for ${wallet.userId ? 'Rider' : 'Driver'}. Balance: ${wallet.balance}`);
    return wallet.balance;
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