import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallet, WalletDocument } from './schemas/wallet.schema';
import { FundWalletDto } from './dto/fund-wallet.dto';
import {
  WalletNotFoundException,
  InsufficientFundsException,
} from '../common/exceptions';
@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
  ) {}

  async fundWallet(fundWalletDto: FundWalletDto): Promise<Wallet> {
    const { userId, amount } = fundWalletDto;

    this.logger.log(`Funding wallet for user ${userId} with amount ${amount}`);

    const wallet = await this.walletModel.findOneAndUpdate(
      { userId },
      { $inc: { balance: amount } },
      { new: true, upsert: true },
    );

    this.logger.log(`Wallet funded successfully for user ${userId}`);
    return wallet;
  }

  async getBalance(userId: string): Promise<number> {
    const wallet = await this.walletModel.findOne({ userId });
    if (!wallet) {
      throw new WalletNotFoundException(userId);
    }
    return wallet.balance;
  }

  async deductAmount(userId: string, amount: number): Promise<Wallet> {
    const session = await this.walletModel.db.startSession();
    session.startTransaction();

    try {
      const wallet = await this.walletModel
        .findOne({ userId })
        .session(session);

      if (!wallet) {
        throw new WalletNotFoundException(userId);
      }

      if (wallet.balance < amount) {
        throw new InsufficientFundsException();
      }

      const updatedWallet = await this.walletModel.findOneAndUpdate(
        { userId, version: wallet.version },
        {
          $inc: { balance: -amount, version: 1 },
        },
        { new: true, session },
      );

      if (!updatedWallet) {
        throw new Error('Concurrent modification detected');
      }

      await session.commitTransaction();
      this.logger.log(`Deducted ${amount} from wallet for user ${userId}`);
      return updatedWallet;
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(
        `Failed to deduct amount for user ${userId}: ${error.message}`,
      );
      throw error;
    } finally {
      session.endSession();
    }
  }

  async refundAmount(userId: string, amount: number): Promise<Wallet> {
    this.logger.log(`Refunding ${amount} to wallet for user ${userId}`);

    const wallet = await this.walletModel.findOneAndUpdate(
      { userId },
      { $inc: { balance: amount } },
      { new: true, upsert: true },
    );

    this.logger.log(`Refunded ${amount} to wallet for user ${userId}`);
    return wallet;
  }
}
