import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { TransactionStatus } from '../common/enums/transaction-status.enum';
import { TransactionType } from '../common/enums/transaction-type.enum';
import { TransactionNotFoundException } from '@/common/exceptions';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
  ) {}

  async createTransaction(
    transactionId: string,
    userId: string,
    amount: number,
    type: TransactionType,
    billDetails?: any,
    metadata?: Record<string, any>,
  ): Promise<Transaction> {
    const transaction = new this.transactionModel({
      transactionId,
      userId,
      amount,
      type,
      status: TransactionStatus.PENDING,
      billDetails,
      metadata,
    });

    const savedTransaction = await transaction.save();
    this.logger.log(`Transaction created: ${transactionId}`);
    return savedTransaction;
  }

  async updateTransactionStatus(
    transactionId: string,
    status: TransactionStatus,
    externalTransactionId?: string,
    failureReason?: string,
  ): Promise<Transaction> {
    const transaction = await this.transactionModel.findOneAndUpdate(
      { transactionId },
      {
        status,
        externalTransactionId,
        failureReason,
        ...(status === TransactionStatus.COMPLETED && {
          completedAt: new Date(),
        }),
      },
      { new: true },
    );

    if (!transaction) {
      throw new TransactionNotFoundException(transactionId);
    }

    this.logger.log(`Transaction ${transactionId} status updated to ${status}`);
    return transaction;
  }

  async getTransaction(transactionId: string): Promise<Transaction> {
    const transaction = await this.transactionModel.findOne({ transactionId });
    if (!transaction) {
      throw new TransactionNotFoundException(transactionId);
    }
    return transaction;
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return this.transactionModel.find({ userId }).sort({ createdAt: -1 });
  }

  async markAsReversed(
    transactionId: string,
    reversalTransactionId: string,
  ): Promise<Transaction> {
    const transaction = await this.transactionModel.findOneAndUpdate(
      { transactionId },
      {
        status: TransactionStatus.REVERSED,
        reversalTransactionId,
      },
      { new: true },
    );

    if (!transaction) {
      throw new TransactionNotFoundException(transactionId);
    }

    this.logger.log(`Transaction ${transactionId} marked as reversed`);
    return transaction;
  }
}
