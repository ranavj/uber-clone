import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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
  constructor(private prisma: PrismaService) {}

  /**
   * 🔒 CORE LOGIC: Process Ride Payment
   * Yeh function Atomic hai. Ya toh pura chalega, ya bilkul nahi.
   * @param amount - Amount in Cents/Paise (Integer)
   */
  async processRidePayment(rideId: string, riderId: string, driverId: string, amount: number) {
    
    // 🛑 Transaction Start (The Lock)
    return await this.prisma.$transaction(async (tx) => {
      
      // 1. Rider ka Wallet dhundo
      const riderWallet = await tx.wallet.findUnique({
        where: { userId: riderId },
      });

      if (!riderWallet) {
        throw new NotFoundException('Rider wallet not found');
      }

      // 2. Balance Check (Locking Logic Part 1)
      if (riderWallet.balance < amount) {
        throw new BadRequestException(`Insufficient balance. Available: ${riderWallet.balance}, Required: ${amount}`);
      }

      // 3. Driver ka Wallet dhundo
      // (Agar nahi hai toh auto-create kar sakte hain, par abhi assume karte hain hai)
      let driverWallet = await tx.wallet.findUnique({
        where: { driverId: driverId },
      });

      if (!driverWallet) {
        // Driver wallet create on the fly if missing
         driverWallet = await tx.wallet.create({
           data: { driverId: driverId, balance: 0 }
         });
      }

      // 4. PAISA KAATO (Rider) - Update returns the new locked row
      await tx.wallet.update({
        where: { id: riderWallet.id },
        data: { balance: riderWallet.balance - amount }, // Decrement
      });

      // 5. PAISA DO (Driver)
      await tx.wallet.update({
        where: { id: driverWallet.id },
        data: { balance: driverWallet.balance + amount }, // Increment
      });

      // 6. HISTORY CREATE KARO (Ledger)
      
      // Rider ki Passbook (Debit)
      await tx.transaction.create({
        data: {
          walletId: riderWallet.id,
          amount: amount,
          type: TxType.DEBIT,
          category: TxCategory.RIDE_PAYMENT,
          status: TxStatus.SUCCESS,
          rideId: rideId,
          description: `Paid for ride #${rideId}`,
        },
      });

      // Driver ki Passbook (Credit)
      await tx.transaction.create({
        data: {
          walletId: driverWallet.id,
          amount: amount,
          type: TxType.CREDIT,
          category: TxCategory.RIDE_EARNING,
          status: TxStatus.SUCCESS,
          rideId: rideId,
          description: `Earnings for ride #${rideId}`,
        },
      });

      return { status: 'SUCCESS', message: 'Payment processed successfully' };
    });
    // 🛑 Transaction End (Lock Released)
  }

  // Helper: Balance check karne ke liye
  async getBalance(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });
    return wallet ? wallet.balance : 0;
  }
  
  // Helper: Wallet create karne ke liye (Jab user register kare)
  async createWallet(userId: string) {
    return await this.prisma.wallet.create({
      data: { userId, balance: 0 }
    });
  }


  /**
   * 💰 TOP-UP WALLET
   * Yeh function tab call hoga jab Stripe payment success hogi.
   */
  async fundWallet(userId: string, amount: number, transactionRef: string) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Wallet dhundo ya banao
      let wallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: { userId, balance: 0 },
        });
      }

      // 2. Balance Badhao
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: wallet.balance + amount,
        },
      });

      // 3. History Record (Credit)
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount: amount,
          type: TxType.CREDIT,
          category: TxCategory.WALLET_TOPUP,
          status: TxStatus.SUCCESS,
          externalId: transactionRef, // Stripe ID yahan aayegi
          description: 'Wallet Top-up via Gateway',
        },
      });

      return updatedWallet;
    });
  }
}