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

  /**
   * Funds an existing wallet or creates a new wallet for a user if one doesn't exist.
   *
   * This method performs an atomic operation to either increment the balance of an existing
   * wallet or create a new wallet with the specified amount if no wallet exists for the user.
   * The operation uses MongoDB's upsert functionality to ensure data consistency.
   *
   * @param {FundWalletDto} fundWalletDto - The data transfer object containing funding information
   * @param {string} fundWalletDto.userId - The unique identifier of the user whose wallet is being funded
   * @param {number} fundWalletDto.amount - The amount to add to the wallet balance (must be positive)
   *
   * @returns {Promise<Wallet>} A promise that resolves to the updated or newly created wallet document

   */
  async fundWallet(
    fundWalletDto: FundWalletDto,
    userId: string,
  ): Promise<Wallet> {
    const { amount } = fundWalletDto;
    this.logger.log(`Funding wallet for user ${userId} with amount ${amount}`);

    const wallet = await this.walletModel.findOneAndUpdate(
      { userId },
      { $inc: { balance: amount } },
      { new: true, upsert: true },
    );

    this.logger.log(`Wallet funded successfully for user ${userId}`);
    return wallet;
  }

  /**
   * Retrieves the balance of a user's wallet.
   * @param userId The ID of the user whose wallet balance is to be retrieved.
   * @returns The balance of the user's wallet.
   */
  async getBalance(userId: string): Promise<number> {
    const wallet = await this.walletModel.findOne({ userId });
    if (!wallet) {
      throw new WalletNotFoundException(userId);
    }
    return wallet.balance;
  }

  /**
   * Deducts a specified amount from a user's wallet.
   * @param userId The ID of the user whose wallet is to be deducted.
   * @param amount The amount to deduct from the user's wallet.
   * @returns The updated wallet document after deduction.
   */
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

  /**
   * Refunds a specified amount to a user's wallet.
   * @param userId The ID of the user whose wallet is to be refunded.
   * @param amount The amount to refund to the user's wallet.
   * @returns The updated wallet document after refund.
   */
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
